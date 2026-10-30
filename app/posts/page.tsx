import Link from "next/link";
import { getAllTags, getAuthors, getCategories, getPostPage } from "@/lib/posts";
import SearchBox from "@/components/search/SearchBox";

/**
 * 文章列表页 —— 自动扫描 content/ 目录生成。
 *
 * 你往 content/ 里丢一个 .md/.mdx 文件，这个列表就多一条（重新 build 后）。
 * 往 content/<分类名>/ 里丢文件，就归到那个分类下。
 *
 * ⚠️ 构建产物形态说明：
 *   content/ 的目录扫描发生在【构建期】，所以这个页面是 ○ Static。
 *   想要「加完文章立刻可见」而不必 rebuild，有两种改法：
 *     ① 加 await connection() → 变成动态渲染（每次请求都扫目录）
 *     ② 给扫描结果打 cacheTag("posts") + 用 revalidateTag("posts") 按需失效
 *   本仓库把它保持为静态 —— 博客最常见的形态。
 */
export default async function PostsIndex() {
  // 首页只渲染【第一页】，其余走 /posts/page/[n]
  const info = await getPostPage(1);
  const posts = info.posts;
  const categories = getCategories();
  const tags = await getAllTags();
  const authors = await getAuthors();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">文章列表</h1>
      <p className="mt-2 text-sm opacity-70">
        内容源：<code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-gray-800">content/</code>
        目录下的 .md / .mdx 文件 —— 放进去即成文章。子目录自动成为<b>分类</b>。
      </p>

      {/* 顶部工具条：分类 / 标签 / RSS */}
      <div className="mt-6 flex flex-col gap-3">
        {categories.length > 0 ? (
          <nav className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider opacity-50">分类</span>
            {categories.map((c) => (
              <Link
                key={c.path}
                href={`/category/${c.path}`}
                className="rounded-full border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                style={c.depth > 0 ? { marginLeft: `${c.depth * 12}px` } : undefined}
                title={c.path}
              >
                {c.depth > 0 ? "↳ " : ""}
                {c.name} · {c.totalCount}
              </Link>
            ))}
          </nav>
        ) : null}

        {tags.length > 0 ? (
          <nav className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider opacity-50">标签</span>
            {tags.map((t) => (
              <Link
                key={t.name}
                href={`/tags/${encodeURIComponent(t.name)}`}
                className="rounded-full border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                {t.name} · {t.count}
              </Link>
            ))}
          </nav>
        ) : null}

        {authors.length > 0 ? (
          <nav className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider opacity-50">作者</span>
            {authors.map((a) => (
              <Link
                key={a.name}
                href={`/author/${encodeURIComponent(a.name)}`}
                className="rounded-full border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                {a.name} · {a.count}
              </Link>
            ))}
          </nav>
        ) : null}

        <nav className="flex flex-wrap items-center gap-3 text-xs">
          <Link href="/archive" className="underline">
            归档
          </Link>
          <Link href="/llms.txt" className="underline">
            llms.txt
          </Link>
          <Link href="/search" className="underline">
            搜索
          </Link>
          <Link href="/tags" className="underline">
            全部标签
          </Link>
          <Link href="/rss.xml" className="underline">
            RSS 订阅
          </Link>
        </nav>
      </div>

      {/* 搜索框：按 / 快捷键可聚焦到这里 */}
      <div className="mt-6 max-w-sm">
        <SearchBox placeholder="搜索标题、标签、摘要与正文…  （按 / 聚焦）" />
      </div>

      <ul className="mt-8 flex flex-col gap-4">
        {posts.map((post) => (
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
              {post.tags && post.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-gray-100 px-2 py-0.5 text-[11px] opacity-70 dark:bg-gray-800"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>

      {/* 分页导航 */}
      {info.totalPages > 1 ? (
        <nav className="mt-10 flex items-center justify-between border-t border-gray-200 pt-4 text-sm dark:border-gray-700">
          <span />
          <span className="text-xs opacity-60">
            {info.page} / {info.totalPages} 页 · 共 {info.total} 篇
          </span>
          {info.hasNext ? (
            <Link href={`/posts/page/${info.page + 1}`} className="underline">
              下一页 →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}

      <div className="mt-10 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-700 dark:bg-amber-950">
        <h2 className="font-semibold">这是怎么做到的</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <code>generateStaticParams()</code> 递归扫描 content/，把每个文件变成一条路由。
          </li>
          <li>
            页面里用动态 <code>{'import(`@/content/${entry.file}`)'}</code> 按路径取文件并渲染。
          </li>
          <li>
            元数据来自 MDX 里的 <code>export const metadata</code> —— Next 原生支持，自动进{" "}
            <code>&lt;head&gt;</code>。
          </li>
          <li>
            路由用 <code>[...slug]</code>（catch-all）才能接住 <code>分类/文件名</code> 这种多段路径。
          </li>
        </ul>
      </div>
    </div>
  );
}
