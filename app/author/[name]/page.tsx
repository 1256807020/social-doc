import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAuthors } from "@/lib/posts";

/**
 * 作者页 —— 列出某个作者的所有文章。
 *
 * Docusaurus / Fumadocs 都有（团队博客必备）。
 * 作者来自 frontmatter 的 `author` 字段，没写的归到「未署名」。
 */
export async function generateStaticParams() {
  const authors = await getAuthors();
  return authors.map((a) => ({ name: a.name }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  return {
    title: `作者：${decoded}`,
    description: `${decoded} 发布的全部文章`,
  };
}

/**
 * ⚠️ 页面组件【不能直接 await params】——
 *
 * Next 16 开了 `cacheComponents` 后，在 <Suspense> 之外访问 params 属于
 * 「运行时数据」，会让整条路由无法预渲染（Blocking Route 报错）。
 *
 * 正确姿势：① 页面组件不 await params，只把 Promise 往下传；
 *         ② 真正 await params 的 async 子组件放在 <Suspense> 内部。
 */
export default function AuthorPage({ params }: { params: Promise<{ name: string }> }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Suspense fallback={<AuthorSkeleton />}>
        <AuthorContent params={params} />
      </Suspense>
    </div>
  );
}

/** 骨架屏 —— 与真实内容同宽，避免流式补上时布局跳动 */
function AuthorSkeleton() {
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
async function AuthorContent({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  // ⚠️ Next.js 对动态段【不做 percent-encoding 解码】——
  //    params.name 拿到的是 "未署名" 的编码串，必须自己 decode。
  const decoded = decodeURIComponent(name);
  const authors = await getAuthors();
  const author = authors.find((a) => a.name === decoded);

  if (!author) {
    notFound();
  }

  return (
    <>
      <header className="border-b border-gray-200 pb-6 dark:border-gray-700">
        <p className="text-xs uppercase tracking-wider opacity-60">作者</p>
        <h1 className="mt-1 text-3xl font-bold">{author.name}</h1>
        <p className="mt-2 text-sm opacity-70">共 {author.count} 篇</p>
      </header>

      <ul className="mt-8 flex flex-col gap-4">
        {author.posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/posts/${post.slug}`}
              className="block rounded-lg border border-gray-200 p-4 transition hover:border-blue-400 dark:border-gray-700 dark:hover:border-blue-600"
            >
              {post.date ? (
                <p className="text-xs opacity-60">{post.date}</p>
              ) : null}
              <h2 className="mt-1 text-lg font-semibold">{post.title}</h2>
              {post.excerpt ? (
                <p className="mt-2 text-sm opacity-75">{post.excerpt}</p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm">
        <Link href="/posts" className="underline">
          ← 返回文章列表
        </Link>
      </p>
    </>
  );
}
