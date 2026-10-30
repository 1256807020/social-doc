import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getCategoryArticles, getCategoryMeta } from "@/lib/posts";

/**
 * 分类页 —— 支持**多级分类**。
 *
 * 路由用 catch-all `[...category]` 而不是 `[category]`：
 *   content/a/b/post.mdx → /category/a/b
 * `[category]` 只匹配一段，接不住二级路径。
 *
 * ⚠️ 顺带说明「多级分类」的两层含义：
 *
 * 1. **文章路由层面：本来就支持**。
 *    `generateStaticParams` 返回 `{ slug: ["a", "b", "post"] }`，
 *    catch-all `[...slug]` 会为每一段都生成实际路径 → /posts/a/b/post。
 *    这就是 Next.js「目录结构 = URL 路径」的文件系统路由规则，
 *    只不过我们的目录在 `content/` 下，由 generateStaticParams 桥接过去。
 *
 * 2. **分类页层面：需要本页这样实现**。
 *    之前 `getCategories()` 只取路径第一段，`/category/a/b` 根本不存在。
 *    现在它返回所有层级的分类节点，catch-all 也接住了多段路径。
 */
export function generateStaticParams() {
  return getCategories().map((c) => ({ category: c.path.split("/") }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string[] }>;
}): Promise<Metadata> {
  const { category: raw } = await params;
  // ⚠️ 动态段不做 percent-encoding 解码 —— 逐段自己解
  const category = raw.map(decodeURIComponent);
  const path = category.join("/");
  const meta = getCategoryMeta(path);
  return {
    title: `分类：${meta.name ?? category[category.length - 1]}`,
    description: meta.description ?? `content/${path}/ 目录下的所有文章`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string[] }>;
}) {
  const { category: raw } = await params;
  const category = raw.map(decodeURIComponent);
  const path = category.join("/");
  const categories = getCategories();

  // 没有这个分类 → 404
  const self = categories.find((c) => c.path === path);
  if (!self) {
    notFound();
  }

  const posts = await getCategoryArticles(path);
  const meta = getCategoryMeta(path);

  // 面包屑：从根到当前分类
  const crumbs = category.map((seg, i) => ({
    name: seg,
    href: `/category/${category.slice(0, i + 1).join("/")}`,
  }));

  // 直接子分类
  const children = categories.filter((c) => c.parent === path);

  return (
    <div className="mx-auto max-w-2xl p-6">
      {/* 面包屑 */}
      <nav className="text-xs opacity-60">
        <Link href="/" className="underline">
          首页
        </Link>
        {crumbs.map((c, i) => (
          <span key={c.href}>
            {" / "}
            {i === crumbs.length - 1 ? (
              <span className="font-semibold opacity-90">{c.name}</span>
            ) : (
              <Link href={c.href} className="underline">
                {c.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <header className="mt-4 border-b border-gray-200 pb-4 dark:border-gray-700">
        <p className="text-xs uppercase tracking-wider opacity-60">分类</p>
        <h1 className="mt-1 text-3xl font-bold">{meta.name ?? self.name}</h1>
        {meta.description ? (
          <p className="mt-2 text-sm opacity-70">{meta.description}</p>
        ) : null}
        <p className="mt-2 text-sm opacity-70">
          共 {posts.length} 篇 —— 来自{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-gray-800">
            content/{path}/
          </code>
        </p>
      </header>

      {/* 子分类 */}
      {children.length > 0 ? (
        <nav className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider opacity-50">子分类</span>
          {children.map((c) => (
            <Link
              key={c.path}
              href={`/category/${c.path}`}
              className="rounded-full border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              {c.name} · {c.totalCount}
            </Link>
          ))}
        </nav>
      ) : null}

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
        <Link href="/posts" className="underline">
          ← 返回全部文章
        </Link>
      </p>
    </div>
  );
}
