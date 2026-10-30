"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * 搜索快捷键。
 *
 * 业界标配（Docusaurus / Nextra / Fumadocs 都有）：
 *   - `/`     → 聚焦搜索框
 *   - `⌘K` / `Ctrl+K` → 跳到搜索页
 *   - `Esc`   → 已经在搜索框时清空 / 退出
 *
 * 纯客户端组件，不需要任何 props —— 挂在根 layout 即可全站生效。
 */
export default function SearchShortcut() {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      // ⌘K / Ctrl+K → 跳搜索页
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        router.push("/search");
        return;
      }

      // `/` → 聚焦页面上唯一的搜索输入框
      if (e.key === "/" && !isTyping) {
        const input = document.querySelector<HTMLInputElement>(
          'input[type="search"]',
        );
        if (input) {
          e.preventDefault();
          input.focus();
        }
        return;
      }

      // Esc → 清空搜索框
      if (e.key === "Escape" && isTyping) {
        const input = target as HTMLInputElement;
        if (input.type === "search" && input.value) {
          input.value = "";
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return null;
}
