import Link from "next/link";
import { getAllTags } from "@/lib/posts";

/**
 * 标签索引页 —— 列出所有标签及其文章数。
 *
 * 标签来自 frontmatter 的 `tags` 字段，写文章时顺手加就行：
 *
 * ```md
 * ---
 * title: "深入理解 SSG 与 ISR"
 * tags: ["Next.js", "缓存", "性能"]
 * ---
 * ```
 *
 * 零配置：加标签 → 这里自动多一个入口 → /tags/<标签> 自动可访问。
 */
export default async function TagsIndex() {
  const tags = await getAllTags();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-bold">标签</h1>
      <p className="mt-2 text-sm opacity-70">
        共 {tags.length} 个标签 —— 来自各篇文章 frontmatter 的{" "}
        <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-gray-800">
          tags
        </code>{" "}
        字段。
      </p>

      <ul className="mt-8 flex flex-wrap gap-3">
        {tags.map((tag) => (
          <li key={tag.name}>
            <Link
              href={`/tags/${encodeURIComponent(tag.name)}`}
              className="flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <span>{tag.name}</span>
              <span className="rounded-full bg-gray-200 px-2 text-xs opacity-70 dark:bg-gray-700">
                {tag.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {tags.length === 0 ? (
        <p className="mt-8 text-sm opacity-60">
          还没有任何标签。在文章 frontmatter 里加 <code>tags: [&quot;xxx&quot;]</code> 就会出现。
        </p>
      ) : null}

      <p className="mt-10 text-sm">
        <Link href="/posts" className="underline">
          ← 返回文章列表
        </Link>
      </p>
    </div>
  );
}
