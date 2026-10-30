import Link from "next/link";
import { getAllPostMeta } from "@/lib/posts";
import { SITE_NAME } from "@/lib/site";

/**
 * 首页 —— 展示最新文章 + 基座能力入口。
 *
 * 注意这里没有任何「内容配置」：文章来自 content/ 目录，
 * 路由、列表、分类全部由 lib/posts.ts 自动推导。
 */
export default async function HomePage() {
  const posts = await getAllPostMeta();
  const latest = posts.slice(0, 5);

  const capabilities = [
    "文章路由（任意深度）",
    "多级分类（目录即分类）",
    "路径分页（静态生成）",
    "标签页",
    "全文搜索（中文子串匹配）",
    "RSS 2.0 + 自动发现",
    "上一篇 / 下一篇",
    "草稿机制（draft: true）",
    "YAML frontmatter",
    "GFM 表格 / 任务列表",
    "Shiki 代码高亮",
    "标题锚点自动生成",
  ];

  return (
    <div>
      <section className="border-b border-[var(--color-border)] pb-8">
        <h1 className="text-4xl font-bold">{SITE_NAME}</h1>
        <p className="mt-3 opacity-70">
          文章站 / 博客站 / 文档站的内容引擎基座。
          <br />
          往 <code className="font-mono">content/</code> 目录丢{" "}
          <code className="font-mono">.md</code> /{" "}
          <code className="font-mono">.mdx</code> 文件，路由、列表、分类、标签、搜索、RSS
          全部自动生成。
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link href="/posts" className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-white">
            浏览全部文章
          </Link>
          <Link href="/search" className="rounded-md border border-[var(--color-border)] px-4 py-2">
            搜索
          </Link>
          <Link href="/rss.xml" className="rounded-md border border-[var(--color-border)] px-4 py-2">
            RSS
          </Link>
        </div>
      </section>

      <section className="py-8">
        <h2 className="text-lg font-semibold">最新文章</h2>
        <ul className="mt-4 flex flex-col gap-4">
          {latest.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/posts/${post.slug}`}
                className="block rounded-lg border border-[var(--color-border)] p-4 transition hover:border-[var(--color-accent)]"
              >
                <div className="flex items-center gap-2 text-xs opacity-60">
                  {post.category ? (
                    <span className="font-mono uppercase">{post.category}</span>
                  ) : null}
                  {post.date ? <span>{post.date}</span> : null}
                </div>
                <h3 className="mt-1 font-semibold">{post.title}</h3>
                {post.excerpt ? (
                  <p className="mt-2 text-sm opacity-75">{post.excerpt}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-[var(--color-border)] py-8">
        <h2 className="text-lg font-semibold">这个基座给了什么</h2>
        <ul className="mt-4 grid gap-2 text-sm opacity-80 sm:grid-cols-2">
          {capabilities.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-[var(--color-accent)]">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
