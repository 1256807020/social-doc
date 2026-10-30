import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAllPostMeta, getAllTags } from "@/lib/posts";

/**
 * 单标签页 —— 列出带这个标签的所有文章。
 *
 * URL 用 `encodeURIComponent` 编码，所以中文标签也能用：
 *   /tags/性能  →  /tags/%E6%80%A7%E8%83%BD
 * Next 会自动解码 `params.tag`，拿到的仍是原始中文。
 *
 * `generateStaticParams` **可以是 async** —— 标签需要读 frontmatter 才能知道，
 * 所以这里直接 await getAllTags()。
 */
export async function generateStaticParams() {
  const tags = await getAllTags();
  // ⚠️ 动态段的值必须是【字符串】—— 这里要取 tag.name，不是整个对象
  return tags.map((tag) => ({ tag: tag.name }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  // ⚠️ Next.js 对动态段【不做 percent-encoding 解码】——
  //    params.tag 拿到的是 "%E6%95%99%E7%A8%8B" 这种原始编码串。
  //    必须自己 decodeURIComponent，否则中文标签永远匹配不上。
  const { tag: raw } = await params;
  const tag = decodeURIComponent(raw);
  return {
    title: `标签：${tag}`,
    description: `带「${tag}」标签的所有文章`,
  };
}

/**
 * ⚠️ 页面组件【不能直接 await params】——
 *
 * Next 16 开了 `cacheComponents`（Cache Components / PPR）后，
 * 在 <Suspense> 之外访问 `params` / `searchParams` / `cookies()` / `headers()`
 * 属于「运行时数据」，会让整条路由无法预渲染：
 *
 *   Blocking Route: Route "/tags/[tag]": Next.js encountered runtime data
 *   during prerendering.
 *
 * 正确姿势（也是 Next 官方文档的写法）：
 *   ① 页面组件【不 await】params，只把 Promise 往下传；
 *   ② 真正 await params 的 async 子组件放在 <Suspense> 内部。
 *
 * 这样 Next 知道「这段数据在 Suspense 边界内读取」，
 * 静态壳照常预渲染，内容流式补上 → 路由恢复可预渲染（◐ 而非 blocking）。
 */
export default function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <Suspense fallback={<TagSkeleton />}>
        <TagContent params={params} />
      </Suspense>
    </div>
  );
}

/** 骨架屏 —— 与真实内容同宽，避免流式补上时布局跳动 */
function TagSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-12 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mt-2 h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mt-8 space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    </div>
  );
}

/** 真正读 params 的部分 —— 必须在 <Suspense> 内部 */
async function TagContent({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: raw } = await params;
  const tag = decodeURIComponent(raw);
  const allTags = await getAllTags();

  // 没有这个标签 → 404
  if (!allTags.some((t) => t.name === tag)) {
    notFound();
  }

  const posts = (await getAllPostMeta()).filter((p) => (p.tags ?? []).includes(tag));

  return (
    <>
      <header className="border-b border-gray-200 pb-4 dark:border-gray-700">
        <p className="text-xs uppercase tracking-wider opacity-60">标签</p>
        <h1 className="mt-1 text-3xl font-bold">{tag}</h1>
        <p className="mt-2 text-sm opacity-70">共 {posts.length} 篇</p>
      </header>

      <ul className="mt-8 flex flex-col gap-4">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/posts/${post.slug}`}
              className="block rounded-lg border border-gray-200 p-4 transition hover:border-blue-400 dark:border-gray-700 dark:hover:border-blue-600"
            >
              {post.date ? <p className="text-xs opacity-60">{post.date}</p> : null}
              <h2 className="mt-1 text-lg font-semibold">{post.title}</h2>
              {post.excerpt ? (
                <p className="mt-2 text-sm opacity-75">{post.excerpt}</p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm">
        <Link href="/tags" className="underline">
          ← 返回标签列表
        </Link>
      </p>
    </>
  );
}
