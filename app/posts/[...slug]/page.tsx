import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdjacentPosts,
  getPostFiles,
  getPostMeta,
  getPostSource,
  getRelatedPosts,
} from "@/lib/posts";
import { getReadingTime } from "@/lib/reading-time";
import { extractToc } from "@/lib/toc";
import { articleJsonLd, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import Toc from "@/components/toc";
import CodeCopy from "@/components/mdx/CodeCopy";
import RelativeTime from "@/components/mdx/RelativeTime";

/**
 * 文章详情页 —— catch-all 动态路由 + 动态 import。
 *
 * 为什么用 `[...slug]` 而不是 `[slug]`？
 *   content/tech/nested-post.mdx  →  /posts/tech/nested-post
 * `[slug]` 只匹配**一段**路径，分类目录下的文章根本匹配不上；
 * `[...slug]` 才能接住多段（catch-all），拿到 ["tech", "nested-post"]。
 *
 * 1. generateStaticParams() 在构建期递归扫描 content/，生成具体路由。
 * 2. 运行时按 slug 动态 import 对应的 .mdx 文件并渲染。
 * 3. 元数据来源：MDX 文件里的 `export const metadata` —— Next 原生支持。
 * 4. SEO：JSON-LD（Article + BreadcrumbList）+ 完整 Open Graph / Twitter。
 */
export function generateStaticParams() {
  return getPostFiles().map((p) => ({ slug: p.slugParts }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getPostFiles().find((p) => p.slug === slug.join("/"));
  if (!entry) return { title: slug.join("/") };

  const mod = await import(`@/content/${entry.file}`);
  const meta = (mod.metadata ?? {}) as Record<string, unknown>;
  const url = absoluteUrl(`/posts/${entry.slug}`);

  return {
    title: (meta.title as string) ?? entry.baseSlug,
    description: (meta.excerpt as string) ?? undefined,
    alternates: { canonical: url },
    authors: meta.author ? [{ name: String(meta.author) }] : undefined,
    keywords: (meta.tags as string[]) ?? undefined,
    openGraph: {
      type: "article",
      title: (meta.title as string) ?? entry.baseSlug,
      description: (meta.excerpt as string) ?? undefined,
      url,
      // 文章级动态 OG 图（见 app/og/[...slug]/route.tsx）
      images: [{ url: absoluteUrl(`/og/${entry.slug}`), width: 1200, height: 630 }],
      publishedTime: meta.date as string | undefined,
      modifiedTime:
        (meta.updated as string) ?? (meta.date as string | undefined),
      authors: meta.author ? [String(meta.author)] : undefined,
      tags: (meta.tags as string[]) ?? undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: (meta.title as string) ?? entry.baseSlug,
      description: (meta.excerpt as string) ?? undefined,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const entry = getPostFiles().find((p) => p.slug === slug.join("/"));

  // 目录里没有这个文件 → 走 404 流程
  if (!entry) {
    notFound();
  }

  const { default: Post } = await import(`@/content/${entry.file}`);
  // 元数据统一从 getPostMeta 取（合并 frontmatter / 手写 export / .json 旁路）
  const metadata = await getPostMeta(entry.slug);
  // 上一篇 / 下一篇（按日期排序后取相邻）
  const { prev, next } = await getAdjacentPosts(entry.slug);
  // 目录（构建期从 Markdown 解析，锚点与正文标题一致）
  const toc = extractToc(getPostSource(entry.slug));
  // 阅读时长
  const reading = getReadingTime(entry.file);
  // 相关文章（按共同标签数排序）
  const related = await getRelatedPosts(entry.slug, 3);

  // 面包屑（多级分类 → 逐级）
  const crumbs = entry.slugParts.slice(0, -1).map((seg, i) => ({
    name: seg,
    href: `/category/${entry.slugParts.slice(0, i + 1).join("/")}`,
  }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* JSON-LD：Article + BreadcrumbList */}
      {jsonLdScript([
        articleJsonLd({
          title: metadata?.title ?? entry.baseSlug,
          description: metadata?.excerpt,
          date: metadata?.date,
          updated: metadata?.updated,
          author: metadata?.author,
          tags: metadata?.tags,
          slug: entry.slug,
          category: entry.category,
        }),
        ...(crumbs.length > 0
          ? [
              breadcrumbJsonLd([
                ...crumbs,
                {
                  name: metadata?.title ?? entry.baseSlug,
                  href: `/posts/${entry.slug}`,
                },
              ]),
            ]
          : []),
      ])}

      {/* 代码块复制按钮（客户端增强，渐进降级） */}
      <CodeCopy />

      <div className="flex flex-col gap-10 lg:flex-row">
        {/* 左侧正文 */}
        <article className="min-w-0 flex-1">
          <header className="border-b border-gray-200 pb-6 dark:border-gray-700">
            {crumbs.length > 0 ? (
              <nav aria-label="面包屑" className="mb-3 text-xs opacity-60">
                <Link href="/posts" className="underline">
                  文章
                </Link>
                {crumbs.map((c, i) => (
                  <span key={c.href}>
                    {" / "}
                    {i === crumbs.length - 1 ? (
                      <span className="opacity-90">{c.name}</span>
                    ) : (
                      <Link href={c.href} className="underline">
                        {c.name}
                      </Link>
                    )}
                  </span>
                ))}
              </nav>
            ) : null}

            <h1 className="text-3xl font-bold md:text-4xl">
              {metadata?.title ?? entry.baseSlug}
            </h1>

            {/* byline：作者 / 发布日期 / 最后更新 / 阅读时长 */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm opacity-70">
              {metadata?.author ? (
                <span>
                  作者{" "}
                  <Link
                    href={`/author/${encodeURIComponent(metadata.author)}`}
                    className="font-medium underline underline-offset-4 opacity-90"
                  >
                    {metadata.author}
                  </Link>
                </span>
              ) : null}
              {metadata?.date ? (
                <time dateTime={metadata.date}>{metadata.date}</time>
              ) : null}
              {metadata?.updated && metadata.updated !== metadata.date ? (
                <RelativeTime iso={metadata.updated} prefix="最后更新于" />
              ) : null}
              <span>{reading.text}</span>
            </div>
          </header>

          <div className="prose prose-neutral dark:prose-invert mt-8 max-w-none leading-7">
            <Post />
          </div>

          {/* 标签 */}
          {metadata?.tags && metadata.tags.length > 0 ? (
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wider opacity-60">
                标签
              </span>
              {metadata.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="rounded-full border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  {tag}
                </Link>
              ))}
            </div>
          ) : null}

          {/* 上一篇 / 下一篇 */}
          <footer className="mt-10 border-t border-gray-200 pt-4 text-sm dark:border-gray-700">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                {prev ? (
                  <Link href={`/posts/${prev.slug}`} className="group block">
                    <span className="text-xs opacity-50">← 上一篇</span>
                    <span className="block truncate underline underline-offset-4">
                      {prev.title}
                    </span>
                  </Link>
                ) : null}
              </div>
              <div className="min-w-0 flex-1 text-right">
                {next ? (
                  <Link href={`/posts/${next.slug}`} className="group block">
                    <span className="text-xs opacity-50">下一篇 →</span>
                    <span className="block truncate underline underline-offset-4">
                      {next.title}
                    </span>
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs opacity-60">
              <Link href="/posts" className="underline">
                ← 返回文章列表
              </Link>
              {entry.category ? (
                <Link href={`/category/${entry.category}`} className="underline">
                  更多「{entry.category}」→
                </Link>
              ) : null}
            </div>
          </footer>

          {/* 相关文章 */}
          {related.length > 0 ? (
            <section className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-700">
              <h2 className="text-lg font-semibold">相关文章</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/posts/${r.slug}`}
                      className="block h-full rounded-lg border border-gray-200 p-3 text-sm transition hover:border-blue-400 dark:border-gray-700 dark:hover:border-blue-600"
                    >
                      <span className="line-clamp-2 font-medium">{r.title}</span>
                      {(r.tags ?? []).length > 0 ? (
                        <span className="mt-2 block text-[11px] opacity-60">
                          {(r.tags ?? []).slice(0, 2).map((t) => `#${t}`).join(" ")}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>

        {/* 右侧目录（桌面端） */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <Toc items={toc} />
        </aside>
      </div>
    </div>
  );
}
