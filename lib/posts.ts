import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getLastGitModified } from "@/lib/git";

/**
 * 「目录即内容源」——递归扫描 content/ 下的文章。
 *
 * 本仓库的博客式示例：
 *   content/hello.mdx            →  /posts/hello
 *   content/tech/nested.mdx      →  /posts/tech/nested      （tech 是分类）
 *   content/life/intro.md        →  /posts/life/intro
 *
 * ⚠️ 这里用的是【递归扫描 + 动态 import】，不是 @next/mdx 的文件式路由。
 *    两者区别见 README 第十一章。
 *
 * ── 元数据的三条来源（优先级从低到高）────────────────────────────
 * 1. YAML frontmatter（remark-mdx-frontmatter 转换而来）—— .md / .mdx 通用 ★推荐
 * 2. 手写的 `export const metadata = {...}` —— 仅 .mdx（MDX 语法层能力）
 * 3. 同名的 `.json` 旁路文件 —— 补充编译链读不到的字段
 *
 * ── 草稿机制 ────────────────────────────────────────────────────
 * frontmatter 里写 `draft: true` 的文章会被**完全排除**：
 *   不生成路由、不出现在列表页、不进 RSS、不进标签页。
 *   检测用 gray-matter 直接读文件（同步、快，不需要 import 编译产物）。
 */

const POSTS_DIR = path.join(process.cwd(), "content");

/** 支持的扩展名：.mdx（可用 JSX）与 .md（纯 Markdown） */
const POST_EXT = /\.(md|mdx)$/;

/** 元数据文件（下划线开头）会被跳过，不当作文章 */
const META_PREFIX = "_";

/** 文章元数据 */
export type PostMeta = {
  title: string;
  date?: string;
  /** 最后更新时间（SEO 的 dateModified 用） */
  updated?: string;
  excerpt?: string;
  tags?: string[];
  /** 作者（SEO 的 author 用） */
  author?: string;
  /** 封面图（OG 图与列表页用） */
  cover?: string;
  /** 草稿：true 时不生成路由、不出现在任何列表里 */
  draft?: boolean;
};

/** 分类元数据（来自分类目录下的 _meta.json） */
export type CategoryMeta = {
  /** 展示名称，默认用目录名 */
  name?: string;
  description?: string;
};

/** 上一篇 / 下一篇的条目 */
export type AdjacentPost = {
  slug: string;
  title: string;
  category?: string;
};

/** 一篇文章的源文件 */
export type PostFile = {
  /** URL 路径（不含扩展名），如 "tech/nested-post" */
  slug: string;
  /** URL 路径拆成数组，给 catch-all 动态段的 params 用 */
  slugParts: string[];
  /** 磁盘上的相对路径（含扩展名），动态 import 时用它当 key */
  file: string;
  /** 同名 .json 旁路元数据文件（若有） */
  jsonFile?: string;
  /** 所在分类（顶层子目录名）；顶层文章为 undefined */
  category?: string;
  /** 不含分类的文件名 */
  baseSlug: string;
};

/**
 * 递归列出 content/ 下所有文章源文件。
 *
 * ⚠️ 两个实测踩到的点：
 *
 * 1. `readdirSync(dir, { recursive: true })` 在 **Windows 上返回的是反斜杠路径**
 *    （如 `tech\nested-post.mdx`），必须统一转成 `/`，否则拼出来的 import key
 *    与打包器生成的 context map 对不上，会报 `Cannot find module`。
 *
 * 2. 用 `recursive: true` 时，返回值里会混有目录名本身（Buffer | string 联合类型），
 *    要先过滤掉非字符串项。
 */
export function getPostFiles(): PostFile[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const all = fs
    .readdirSync(POSTS_DIR, { recursive: true })
    .filter((entry): entry is string => typeof entry === "string")
    // Windows 的反斜杠统一成正斜杠
    .map((file) => file.split(path.sep).join("/"));

  const jsonFiles = new Set(all.filter((f) => f.endsWith(".json")));

  return all
    .filter((file) => POST_EXT.test(file))
    // 下划线开头的文件是元数据文件（如 _meta.json），不是文章
    .filter((file) => !file.split("/").some((seg) => seg.startsWith(META_PREFIX)))
    .map((file) => {
      const slug = file.replace(POST_EXT, "");
      const parts = slug.split("/");
      const baseSlug = parts[parts.length - 1];
      // 顶层子目录 = 分类；多级目录时取第一段
      const category = parts.length > 1 ? parts[0] : undefined;
      // 同名 .json 旁路（把扩展名换成 .json）
      const jsonCandidate = file.replace(POST_EXT, ".json");
      return {
        slug,
        slugParts: parts,
        file,
        jsonFile: jsonFiles.has(jsonCandidate) ? jsonCandidate : undefined,
        category,
        baseSlug,
      };
    })
    // 草稿直接剔除：路由、列表、RSS、标签页都看不到它
    .filter((p) => !isDraft(p.file))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * 判断某篇文章是不是草稿。
 *
 * 用 gray-matter 同步读文件头部 —— 不用 import 编译产物，快得多。
 * 只认 YAML frontmatter 里的 `draft: true`（字符串 "true" 也认）。
 */
export function isDraft(file: string): boolean {
  try {
    const full = path.join(POSTS_DIR, file);
    const { data } = matter(fs.readFileSync(full, "utf-8"));
    return data.draft === true || data.draft === "true";
  } catch {
    return false;
  }
}

/** 只要 slug 列表 */
export function getPostSlugs(): string[] {
  return getPostFiles().map((p) => p.slug);
}

/** 读旁路 .json 元数据文件 */
function readJsonMeta(file: string): Partial<PostMeta> {
  try {
    const full = path.join(POSTS_DIR, file);
    return JSON.parse(fs.readFileSync(full, "utf-8")) as Partial<PostMeta>;
  } catch {
    return {};
  }
}

/**
 * 读出单篇文章的元数据。
 *
 * 合并优先级：**.json 旁路 > MDX 的 ESM export**。
 * 旁路优先是为了让 `.md` 文件也能带元数据 —— 它的 ESM 导出根本不生效。
 *
 * 关键点：动态 import 表达式 —— Turbopack / webpack 会把它编译成
 * 「包含该目录下所有文件（含子目录）」的 context module，所以运行时按 slug 取文件很快。
 * 实测路径别名 `@/content/xxx.mdx` 在这里可用（比相对路径更稳健）。
 */
export async function getPostMeta(slug: string): Promise<PostMeta | null> {
  const entry = getPostFiles().find((p) => p.slug === slug);
  if (!entry) return null;

  let meta: Partial<PostMeta> = {};

  // ① MDX 编译产物里的元数据
  try {
    // ⚠️ 这里必须用【含扩展名的完整相对路径】当 key：
    //    动态 import 表达式会被编译成「该目录下所有匹配扩展名的文件」的 context map，
    //    key 是完整路径。写死 .mdx 就找不到 .md 文件了。
    const mod = await import(`@/content/${entry.file}`);

    // 两条来源，frontmatter 优先：
    //   mod.frontmatter —— YAML frontmatter（remark-mdx-frontmatter 转换而来）
    //                     ★ .md 与 .mdx 都有效，这是最通用的写法
    //   mod.metadata    —— 手写的 export const metadata（Next 原生识别，自动进 <head>）
    meta = {
      ...((mod.frontmatter ?? {}) as Partial<PostMeta>),
      ...((mod.metadata ?? {}) as Partial<PostMeta>),
    };
  } catch {
    // 编译产物异常时不应让整个列表页挂掉，退化成「只有 slug」
  }

  // ② .json 旁路（优先级最高，适合放编译链读不到的字段）
  if (entry.jsonFile) {
    meta = { ...meta, ...readJsonMeta(entry.jsonFile) };
  }

  // ③ Git 最后编辑时间 —— frontmatter 没写 updated 时兜底
  //    （读者据此判断内容新鲜度，Docusaurus / Fumadocs 的标配）
  if (!meta.updated) {
    const gitTime = getLastGitModified(entry.file);
    if (gitTime) meta.updated = gitTime.slice(0, 10);
  }

  return { title: entry.baseSlug, ...meta };
}

/** 读出全部文章的元数据，按日期倒序 */
export async function getAllPostMeta(): Promise<
  (PostMeta & { slug: string; category?: string })[]
> {
  const files = getPostFiles();
  const metas = await Promise.all(
    files.map(async (f) => ({
      slug: f.slug,
      category: f.category,
      ...((await getPostMeta(f.slug)) ?? { title: f.baseSlug }),
    })),
  );
  return metas.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

/**
 * 一个分类节点（可能有多级）。
 *
 * 路径就是它在 content/ 里的相对目录路径：
 *   content/tech/            →  分类 "tech"（顶层）
 *   content/a/b/             →  分类 "a" 与 "a/b"（两级）
 *
 * ⚠️ 注意：**路由层面多级路径本来就支持** ——
 *    `generateStaticParams` 返回 `{ slug: ["a", "b", "post"] }`，
 *    catch-all `[...slug]` 会为每一段都生成实际路径（/posts/a/b/post）。
 *    这里要补的是「分类页本身」的层级能力。
 */
export type CategoryNode = {
  /** 完整路径，如 "a/b" */
  path: string;
  /** 最后一段的名字，如 "b" */
  name: string;
  /** 层级深度，顶级为 0 */
  depth: number;
  /** 父分类路径，顶级为 undefined */
  parent?: string;
  /** 直接挂在该分类下的文章数 */
  count: number;
  /** 该分类及其所有子分类下的文章总数 */
  totalCount: number;
  /** 子分类路径列表 */
  children: string[];
};

/** 每页多少篇文章 */
export const POSTS_PER_PAGE = 6;

/**
 * 分页信息。
 *
 * 用【路径分页】（`/posts/page/2`）而不是 query 参数（`/posts?page=2`）：
 *   - 路径分页是【静态生成】的，每页都有独立 URL（SEO 友好）
 *   - query 参数会让页面变成动态渲染，在 Cache Components 模式下要 `await connection()`
 */
export type PostPageInfo = {
  /** 当前页码，从 1 开始 */
  page: number;
  /** 总页数 */
  totalPages: number;
  /** 总文章数 */
  total: number;
  /** 是否有上一页 */
  hasPrev: boolean;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 当前页的文章 */
  posts: (PostMeta & { slug: string; category?: string })[];
};

/**
 * 取第 page 页的文章（page 从 1 开始）。
 *
 * page 超出范围时返回空数组（由调用方决定是 404 还是回退到最后一页）。
 */
export async function getPostPage(page: number): Promise<PostPageInfo> {
  const all = await getAllPostMeta();
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));

  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * POSTS_PER_PAGE;

  return {
    page: current,
    totalPages,
    total,
    hasPrev: current > 1,
    hasNext: current < totalPages,
    posts: all.slice(start, start + POSTS_PER_PAGE),
  };
}

/**
 * 列出所有层级的分类。
 *
 * `content/a/b/post.mdx` 会产生两个分类节点："a" 与 "a/b"。
 * 排序：先按层级，再按文章总数倒序 —— 保证树形结构在列表里是连续的。
 */
export function getCategories(): CategoryNode[] {
  const files = getPostFiles();

  // 统计每个分类路径下的文章数
  const direct = new Map<string, number>();
  for (const f of files) {
    const parts = f.slugParts.slice(0, -1);          // 去掉文件名 = 目录部分
    for (let i = 1; i <= parts.length; i++) {
      const path = parts.slice(0, i).join("/");
      direct.set(path, (direct.get(path) ?? 0) + 1);
    }
  }

  const paths = [...direct.keys()].sort((a, b) => {
    const depthDiff = a.split("/").length - b.split("/").length;
    if (depthDiff !== 0) return depthDiff;
    return (direct.get(b) ?? 0) - (direct.get(a) ?? 0) || a.localeCompare(b);
  });

  return paths.map((path) => {
    const parts = path.split("/");
    return {
      path,
      name: parts[parts.length - 1],
      depth: parts.length - 1,
      parent: parts.length > 1 ? parts.slice(0, -1).join("/") : undefined,
      count: direct.get(path) ?? 0,
      // totalCount = 该分类自己 + 所有后代分类的文章数
      totalCount: files.filter((f) => {
        const dirs = f.slugParts.slice(0, -1);
        return dirs.join("/") === path || dirs.join("/").startsWith(`${path}/`);
      }).length,
      children: paths.filter((p) => p.startsWith(`${path}/`) && !p.slice(path.length + 1).includes("/")),
    };
  });
}

/**
 * 取某个分类（可多级）下的文章。
 *
 * 包含该分类**及其所有子分类**下的文章：
 *   getCategoryArticles("a")    →  content/a/** 的全部
 *   getCategoryArticles("a/b")  →  只 content/a/b/** 的
 */
export async function getCategoryArticles(
  categoryPath: string,
): Promise<(PostMeta & { slug: string; category?: string })[]> {
  const all = await getAllPostMeta();
  return all.filter((p) => {
    const dirs = p.slug.split("/").slice(0, -1).join("/");
    return dirs === categoryPath || dirs.startsWith(`${categoryPath}/`);
  });
}

/**
 * 列出所有标签及其文章数（按文章数倒序）。
 *
 * 标签来自 frontmatter 的 `tags` 字段，`.md` 与 `.mdx` 都支持。
 */
export async function getAllTags(): Promise<{ name: string; count: number }[]> {
  const map = new Map<string, number>();
  for (const post of await getAllPostMeta()) {
    for (const tag of post.tags ?? []) {
      map.set(tag, (map.get(tag) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** 某篇文章所属的标签页（用于详情页展示标签） */
export async function getPostTags(slug: string): Promise<string[]> {
  const meta = await getPostMeta(slug);
  return meta?.tags ?? [];
}

/**
 * 上一篇 / 下一篇。
 *
 * 列表按 `date` 倒序（新的在前），所以：
 *   - 「上一篇」= 更新的那篇 = 数组里【前】一个
 *   - 「下一篇」= 更旧的那篇 = 数组里【后】一个
 *
 * 边界：第一篇没有上一篇，最后一篇没有下一篇（返回 null）。
 */
export async function getAdjacentPosts(
  slug: string,
): Promise<{ prev: AdjacentPost | null; next: AdjacentPost | null }> {
  const posts = await getAllPostMeta();
  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1) return { prev: null, next: null };

  const toAdjacent = (p: (typeof posts)[number] | undefined) =>
    p
      ? {
          slug: p.slug,
          title: p.title,
          category: p.category,
        }
      : null;

  return {
    prev: toAdjacent(posts[index - 1]),
    next: toAdjacent(posts[index + 1]),
  };
}

/** 读分类的元数据（分类目录下的 _meta.json） */
export function getCategoryMeta(category: string): CategoryMeta {
  const file = `${category}/_meta.json`;
  try {
    const full = path.join(POSTS_DIR, file);
    return JSON.parse(fs.readFileSync(full, "utf-8")) as CategoryMeta;
  } catch {
    return {};
  }
}

/**
 * 读某篇文章的源文件（去掉 frontmatter 的正文原文）。
 *
 * TOC 提取、阅读时长这类「需要看源码」的功能都走这里。
 */
export function getPostSource(slug: string): string {
  const entry = getPostFiles().find((p) => p.slug === slug);
  if (!entry) return "";
  try {
    const full = path.join(POSTS_DIR, entry.file);
    return matter(fs.readFileSync(full, "utf-8")).content;
  } catch {
    return "";
  }
}

/**
 * 相关文章 —— 按「共同标签数」排序，取前 limit 篇。
 *
 * 标签重合度越高越相关 —— 这比「同分类」更精准
 * （同一分类里可能有毫不相关的文章）。
 */
export async function getRelatedPosts(
  slug: string,
  limit = 3,
): Promise<(PostMeta & { slug: string })[]> {
  const all = await getAllPostMeta();
  const current = all.find((p) => p.slug === slug);
  if (!current) return [];

  const currentTags = new Set(current.tags ?? []);

  return all
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      post: p,
      score: (p.tags ?? []).filter((t) => currentTags.has(t)).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || (b.post.date ?? "").localeCompare(a.post.date ?? ""))
    .slice(0, limit)
    .map((x) => x.post);
}

/**
 * 列出所有作者及其文章数。
 *
 * 作者来自 frontmatter 的 `author` 字段；没写的归到「未署名」。
 */
export async function getAuthors(): Promise<
  { name: string; count: number; posts: (PostMeta & { slug: string })[] }[]
> {
  const all = await getAllPostMeta();
  const map = new Map<string, (PostMeta & { slug: string })[]>();

  for (const post of all) {
    const name = post.author ?? "未署名";
    if (!map.has(name)) map.set(name, []);
    map.get(name)!.push(post);
  }

  return [...map.entries()]
    .map(([name, posts]) => ({ name, count: posts.length, posts }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * 归档 —— 按年月分组所有文章。
 *
 * 返回结构：[{ year: "2026", months: [{ month: "11", posts: [...] }] }]
 * 月份倒序（新的在前）。
 */
export async function getArchive(): Promise<
  {
    year: string;
    months: {
      month: string;
      posts: (PostMeta & { slug: string; category?: string })[];
    }[];
  }[]
> {
  const all = await getAllPostMeta();
  const byYear = new Map<string, Map<string, (PostMeta & { slug: string })[]>>();

  for (const post of all) {
    const d = post.date ? new Date(post.date) : null;
    if (!d || Number.isNaN(d.getTime())) continue;
    const year = String(d.getFullYear());
    const month = String(d.getMonth() + 1).padStart(2, "0");
    if (!byYear.has(year)) byYear.set(year, new Map());
    const months = byYear.get(year)!;
    if (!months.has(month)) months.set(month, []);
    months.get(month)!.push(post);
  }

  return [...byYear.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, months]) => ({
      year,
      months: [...months.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([month, posts]) => ({ month, posts })),
    }));
}
