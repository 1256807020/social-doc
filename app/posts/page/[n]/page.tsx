import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPostPage } from "@/lib/posts";

/**
 * 分页页 —— `/posts/page/2`、`/posts/page/3` …
 *
 * 为什么用【路径分页】而不是 `/posts?page=2`？
 *
 * | | 路径分页 | query 参数 |
 * |---|---|---|
 * | 渲染方式 | **静态生成**（每个页码一条独立 HTML） | 动态渲染（要 `await connection()`） |
 * | SEO | 每页有独立 URL，可被索引 | 所有页共用一个 URL |
 * | 缓存 | 构建期就定好 | 每次请求都算 |
 *
 * 在开启了 Cache Components 的项目里，静态优先是更省事的选择。
 *
 * ⚠️ 路由匹配不会冲突：
 *   `/posts/page/2` → 命中 `app/posts/page/[n]/page.tsx`（静态段 `page` 优先于 catch-all）
 *   `/posts/tech/post` → 命中 `app/posts/[...slug]/page.tsx`
 */
export async function generateStaticParams() {
  // ⚠️ generateStaticParams **可以是 async** —— 总页数需要读文章才能算出来，
  //    直接 await getPostPage(1) 拿到 totalPages，精确生成每一页。
  //    （比「保守估计 50 页」好：不会生成一堆 404 路由）
  const info = await getPostPage(1);
  // 从第 2 页开始 —— 第 1 页就是 /posts，不重复生成
  const pages = Array.from({ length: Math.max(0, info.totalPages - 1) }, (_, i) => ({
    n: String(i + 2),
  }));

  // ⚠️ Cache Components 要求 generateStaticParams 至少返回一个结果，
  //    否则构建期报 "all generateStaticParams functions must return at least one result"。
  //    「只有 1 页」时也要吐一个 —— 这里给第 1 页，
  //    页面内部会把它重定向到 /posts（不产生重复内容）。
  return pages.length > 0 ? pages : [{ n: "1" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string }>;
}): Promise<Metadata> {
  const { n } = await params;
  const page = Number(n);
  const info = await getPostPage(page);
  if (page > info.totalPages) return { title: "页面不存在" };
  return {
    title: `文章列表 · 第 ${info.page} 页`,
    description: `共 ${info.total} 篇文章，第 ${info.page}/${info.totalPages} 页`,
  };
}

export default async function PostsPageN({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const page = Number(n);
  const info = await getPostPage(page);

  // 第 1 页就是 /posts —— 重定向过去，避免两份重复内容
  if (page === 1) {
    redirect("/posts");
  }

  // 超出范围 → 404
  if (!Number.isFinite(page) || page < 1 || page > info.totalPages) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <header className="border-b border-gray-200 pb-4 dark:border-gray-700">
        <p className="text-xs uppercase tracking-wider opacity-60">
          第 {info.page} / {info.totalPages} 页
        </p>
        <h1 className="mt-1 text-3xl font-bold">文章列表</h1>
        <p className="mt-2 text-sm opacity-70">共 {info.total} 篇文章</p>
      </header>

      <ul className="mt-8 flex flex-col gap-4">
        {info.posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/posts/${post.slug}`}
              className="block rounded-lg border border-gray-200 p-4 transition hover:border-blue-400 dark:border-gray-700 dark:hover:border-blue-600"
            >
              <div className="flex items-center gap-2">
                {post.category ? (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] uppercase opacity-70 dark:bg-gray-800">
                    {post.category}
                  </span>
                ) : null}
                {post.date ? (
                  <span className="text-xs opacity-60">{post.date}</span>
                ) : null}
              </div>
              <h2 className="mt-1 text-lg font-semibold">{post.title}</h2>
              {post.excerpt ? (
                <p className="mt-2 text-sm opacity-75">{post.excerpt}</p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>

      {/* 分页导航 */}
      <nav className="mt-10 flex items-center justify-between border-t border-gray-200 pt-4 text-sm dark:border-gray-700">
        {info.hasPrev ? (
          <Link
            href={info.page === 2 ? "/posts" : `/posts/page/${info.page - 1}`}
            className="underline"
          >
            ← 上一页
          </Link>
        ) : (
          <span />
        )}

        <span className="text-xs opacity-60">
          {info.page} / {info.totalPages}
        </span>

        {info.hasNext ? (
          <Link href={`/posts/page/${info.page + 1}`} className="underline">
            下一页 →
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <p className="mt-6 text-sm">
        <Link href="/posts" className="underline">
          ← 返回第一页
        </Link>
      </p>
    </div>
  );
}
