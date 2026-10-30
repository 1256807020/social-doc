"use client";

import Fuse from "fuse.js";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { SearchDoc } from "@/lib/search";

/**
 * 客户端搜索组件。
 *
 * ── 两条腿走路 ──────────────────────────────────────────────
 * ① **子串匹配**（大小写不敏感）—— 中文 100% 可靠
 *    「缓存」能命中正文里的「缓存机制」；Fuse 的编辑距离做不到这点。
 * ② **Fuse.js 模糊匹配** —— 英文容错：拼错一个字母也能搜到（SSG → SSG/ISG）。
 *
 * 相关度权重（子串命中）：
 *   标题 100 · 标签 60 · 摘要 40 · 正文 20
 */
export default function SearchClient({ docs }: { docs: SearchDoc[] }) {
  // 从 URL 读初始关键词 —— 这样 /search?q=xxx 可以直接分享
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const fuse = useMemo(
    () =>
      new Fuse(docs, {
        keys: [
          { name: "title", weight: 3 },
          { name: "tags", weight: 2 },
          { name: "excerpt", weight: 1.5 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [docs],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    // ① 子串匹配
    const scoreOf = (doc: SearchDoc): number => {
      let score = 0;
      if (doc.title.toLowerCase().includes(q)) score += 100;
      if (doc.tags.some((t) => t.toLowerCase().includes(q))) score += 60;
      if (doc.excerpt.toLowerCase().includes(q)) score += 40;
      if (doc.content.toLowerCase().includes(q)) score += 20;
      return score;
    };

    const bySubstring = docs
      .map((doc) => ({ doc, score: scoreOf(doc) }))
      .filter((r) => r.score > 0);

    // ② Fuse 模糊匹配（英文容错）
    const byFuzzy = fuse.search(q).map((r) => ({ doc: r.item, score: 30 }));

    // 合并：同一篇取最高分
    const merged = new Map<string, { doc: SearchDoc; score: number }>();
    for (const r of [...bySubstring, ...byFuzzy]) {
      const prev = merged.get(r.doc.slug);
      if (!prev || r.score > prev.score) merged.set(r.doc.slug, r);
    }

    return [...merged.values()].sort((a, b) => b.score - a.score);
  }, [query, docs, fuse]);

  /** 把命中片段截出来并高亮 */
  function highlight(text: string, q: string) {
    if (!q) return text;
    const lower = text.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx === -1) return text;
    const start = Math.max(0, idx - 20);
    const end = Math.min(text.length, idx + q.length + 40);
    return (
      <>
        {start > 0 ? "…" : ""}
        {text.slice(start, idx)}
        <mark className="rounded bg-yellow-200 px-0.5 text-black dark:bg-yellow-800 dark:text-yellow-100">
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length, end)}
        {end < text.length ? "…" : ""}
      </>
    );
  }

  const q = query.trim().toLowerCase();

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索标题、标签、摘要与正文…"
        autoFocus
        className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900"
      />

      {q ? (
        <p className="mt-3 text-xs opacity-60">
          找到 {results.length} 篇
        </p>
      ) : (
        <p className="mt-3 text-xs opacity-60">
          共索引 {docs.length} 篇文章的标题、标签、摘要与正文。
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-4">
        {results.map(({ doc }) => (
          <li key={doc.slug}>
            <Link
              href={`/posts/${doc.slug}`}
              className="block rounded-lg border border-gray-200 p-4 transition hover:border-blue-400 dark:border-gray-700 dark:hover:border-blue-600"
            >
              <div className="flex items-center gap-2">
                {doc.category ? (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] uppercase opacity-70 dark:bg-gray-800">
                    {doc.category}
                  </span>
                ) : null}
                {doc.date ? (
                  <span className="text-xs opacity-60">{doc.date}</span>
                ) : null}
              </div>
              <h2 className="mt-1 text-lg font-semibold">{highlight(doc.title, q)}</h2>
              {doc.excerpt ? (
                <p className="mt-2 text-sm opacity-75">{highlight(doc.excerpt, q)}</p>
              ) : null}
              {doc.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {doc.tags.map((tag) => (
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

      {q && results.length === 0 ? (
        <p className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-700 dark:bg-amber-950">
          没有匹配「{query}」的文章。
        </p>
      ) : null}
    </div>
  );
}
