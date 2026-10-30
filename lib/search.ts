import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getAllPostMeta, getPostFiles } from "@/lib/posts";

/**
 * 全文搜索 —— 构建期算索引，客户端做匹配。
 *
 * ── 为什么索引在构建期算？ ────────────────────────────────────
 * 正文的纯文本拿不到「编译后」版本（MDX 编译成 React 组件了），
 * 但**源文件**里有 Markdown 原文 —— 构建期直接读源文件剥标记即可。
 * 索引做一次，客户端零请求、首屏就有结果。
 *
 * ── 为什么中文要用「子串匹配」而不是 Fuse 的模糊匹配？ ──────────
 * Fuse.js 的匹配算法对中文效果差：它按「位图 + 编辑距离」算相似度，
 * 而中文没有空格分词，「缓存机制」与「缓存」的距离并不小。
 *
 * 所以本实现是**两条腿走路**：
 *   ① 子串匹配（大小写不敏感）—— 中文 100% 可靠
 *   ② Fuse.js 模糊匹配 —— 英文容错（拼写错误、大小写、词形变化）
 * 两者合并去重，按相关度排序。
 */

const POSTS_DIR = path.join(process.cwd(), "content");

/** 搜索索引里的一条记录 */
export type SearchDoc = {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  category?: string;
  date?: string;
  /** 正文纯文本（已剥离 Markdown 标记，截断到 800 字） */
  content: string;
};

/**
 * Markdown → 纯文本（粗暴但够用）。
 *
 * 逐条剥掉：代码围栏、标题符号、列表符号、引用符号、强调符号、
 * 行内代码反引号、链接语法、图片语法、HTML/JSX 标签、水平线。
 */
export function markdownToPlainText(md: string): string {
  return (
    md
      // 代码块：去掉围栏，保留代码内容
      .replace(/```[a-z]*\n([\s\S]*?)```/g, "$1")
      // 行内代码
      .replace(/`([^`]*)`/g, "$1")
      // 图片 ![alt](url) → alt
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      // 链接 [text](url) → text
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      // 标题 / 列表 / 引用 / 水平线
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      .replace(/^\s*>\s?/gm, "")
      .replace(/^\s*[-*_]{3,}\s*$/gm, "")
      // 强调
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      // HTML / JSX 标签
      .replace(/<[^>]+>/g, " ")
      // 表格分隔行
      .replace(/^\s*\|?[\s:|-]+\|[\s:|-]*$/gm, " ")
      // 其余空白压成空格
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * 构建搜索索引（构建期执行一次）。
 *
 * 数据来源：
 *   - 元数据（title/excerpt/tags）→ 走 getAllPostMeta()，与页面显示的完全一致
 *   - 正文纯文本 → 直接读源文件，用 gray-matter 剥掉 frontmatter
 */
export async function buildSearchIndex(): Promise<SearchDoc[]> {
  const metas = await getAllPostMeta();
  const files = getPostFiles();
  const fileBySlug = new Map(files.map((f) => [f.slug, f]));

  return metas.map((meta) => {
    const entry = fileBySlug.get(meta.slug);
    let content = "";

    if (entry) {
      try {
        const raw = fs.readFileSync(path.join(POSTS_DIR, entry.file), "utf-8");
        // gray-matter 剥掉 frontmatter，剩下的就是正文（.mdx 的 ESM 导出也在里面，
        // 但 markdownToPlainText 会把 export const metadata = {...} 里的符号剥掉大部分）
        const { content: body } = matter(raw);
        content = markdownToPlainText(body).slice(0, 800);
      } catch {
        content = "";
      }
    }

    return {
      slug: meta.slug,
      title: meta.title,
      excerpt: meta.excerpt ?? "",
      tags: meta.tags ?? [],
      category: meta.category,
      date: meta.date,
      content,
    };
  });
}
