import { toString } from "mdast-util-to-string";
import { unified } from "unified";
import remarkParse from "remark-parse";
import GithubSlugger from "github-slugger";

/**
 * 从 Markdown 源码提取标题目录（TOC）。
 *
 * ⚠️ 为什么用 remark 解析 AST，而不是正则匹配 `^## `？
 * 因为 `rehype-slug` 生成锚点 id 时，���入是**渲染后的纯文本**：
 *   `## **粗体** 标题`  →  rehype-slug 给出 "粗体-标题"
 *   正则拿到的却是      →  "**粗体** 标题"  →  slug 算出来不一样 → 锚点对不上
 *
 * 用 remark 解析 AST + `mdast-util-to-string` 取纯文本，
 * 再用 **github-slugger**（rehype-slug 内部用的同一个库）生成 slug，
 * 保证 TOC 的锚点与正文标题 100% 一致。
 */

export type TocItem = {
  /** 标题文字 */
  text: string;
  /** 锚点 id（与正文标题的 id 一致） */
  id: string;
  /** 层级：2 = h2，3 = h3 */
  depth: number;
};

/** 提取目录（只取 h2 / h3，h1 是文章标题本身） */
export function extractToc(markdown: string): TocItem[] {
  const tree = unified().use(remarkParse).parse(markdown);
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];

  // 先把 h1 也过一遍 slugger，保证编号与正文完全一致
  // （rehype-slug 是按文档顺序处理所有标题的）
  const headings: { depth: number; text: string }[] = [];
  visit(tree, (node) => {
    if (node.type === "heading") {
      headings.push({ depth: node.depth ?? 1, text: toString(node) });
    }
  });

  for (const h of headings) {
    const id = slugger.slug(h.text);
    if (h.depth === 2 || h.depth === 3) {
      items.push({ text: h.text, id, depth: h.depth });
    }
  }

  return items;
}

/** 简易 AST 遍历（避免为了一个功能再装 unist-util-visit） */
function visit(
  node: { type: string; children?: unknown[]; depth?: number },
  cb: (n: { type: string; depth?: number }) => void,
): void {
  cb(node as { type: string; depth?: number });
  const children = node.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      if (child && typeof child === "object" && "type" in child) {
        visit(child as { type: string; children?: unknown[] }, cb);
      }
    }
  }
}
