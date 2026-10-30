"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * 站内搜索框（列表页 / 导航栏用）。
 *
 * 按 Enter 跳到 /search?q=xxx —— **搜索结果可以分享**，
 * 这是 Nextra / Fumadocs 的标准做法（很多站点的搜索是纯客户端的，搜完就没法分享）。
 *
 * 另外配合全站的 `/` 快捷键：焦点落在这里时按 `/` 会聚焦它。
 */
export default function SearchBox({
  placeholder = "搜索文章…",
  className = "",
}: {
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const query = q.trim();
        if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
      }}
      className={className}
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="搜索文章"
        className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-1.5 text-sm outline-none transition focus:border-blue-500 dark:border-gray-700"
      />
    </form>
  );
}
