"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/toc";

/**
 * 目录（TOC）—— 客户端组件。
 *
 * 两个业界标配能力：
 *  1. **滚动高亮**：当前所在章节在右侧目录里高亮（IntersectionObserver）
 *  2. **吸顶**：滚动时固定在视口右侧
 *
 * 为什么必须是客户端组件：滚动监听只能在浏览器跑。
 * 但 TOC 数据（标题 + 锚点）是**构建期**由 lib/toc.ts 从 Markdown 解析出来的，
 * 作为 props 传入 —— 服务端已经把数据算好了，客户端只负责交互。
 */
export default function Toc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>("");

  // 滚动高亮：观察所有标题，取「当前可见的那个」
  useEffect(() => {
    if (items.length === 0) return;

    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 找当前在视口上方的最后一个标题
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      // 视口上方 20% 处作为判定线
      { rootMargin: "-80px 0px -70% 0px", threshold: [0, 1] },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="目录"
      className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto text-sm"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-50">
        目录
      </p>
      <ul className="space-y-1 border-l border-gray-200 dark:border-gray-700">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={
                "block border-l-2 py-1 pl-3 transition " +
                (item.depth === 3 ? "pl-6 text-xs " : "") +
                (activeId === item.id
                  ? "border-blue-500 font-medium text-blue-600 dark:text-blue-400"
                  : "border-transparent opacity-70 hover:opacity-100")
              }
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
