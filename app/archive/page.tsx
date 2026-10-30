import Link from "next/link";
import { getArchive } from "@/lib/posts";

/**
 * 归档页 —— 按年月分组所有文章。
 *
 * Docusaurus / Nextra / Fumadocs 都有这个页面，是内容站的标配：
 * 给读者一条「时间轴」视角的浏览路径。
 */
export default async function ArchivePage() {
  const archive = await getArchive();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header>
        <h1 className="text-3xl font-bold">归档</h1>
        <p className="mt-2 text-sm opacity-70">
          按发布时间分组的所有文章，共{" "}
          {archive.reduce((n, y) => n + y.months.reduce((m, x) => m + x.posts.length, 0), 0)} 篇。
        </p>
      </header>

      {archive.length === 0 ? (
        <p className="mt-10 text-sm opacity-60">还没有带日期的文章。</p>
      ) : (
        <div className="mt-10 flex flex-col gap-10">
          {archive.map((year) => (
            <section key={year.year}>
              <h2 className="text-2xl font-bold">{year.year}</h2>
              <div className="mt-4 flex flex-col gap-6">
                {year.months.map((m) => (
                  <div key={m.month}>
                    <h3 className="text-sm font-semibold uppercase tracking-wider opacity-50">
                      {Number(m.month)} 月 · {m.posts.length} 篇
                    </h3>
                    <ul className="mt-2 flex flex-col gap-1">
                      {m.posts.map((post) => (
                        <li key={post.slug} className="flex items-baseline gap-3 text-sm">
                          <time
                            dateTime={post.date}
                            className="shrink-0 font-mono text-xs opacity-50"
                          >
                            {String(Number(m.month)).padStart(2, "0")}-01
                          </time>
                          <Link href={`/posts/${post.slug}`} className="underline-offset-4 hover:underline">
                            {post.title}
                          </Link>
                          {post.category ? (
                            <span className="shrink-0 font-mono text-[10px] uppercase opacity-40">
                              {post.category}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-12 text-sm">
        <Link href="/posts" className="underline">
          ← 返回文章列表
        </Link>
      </p>
    </div>
  );
}
