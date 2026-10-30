"use client";

import { toggleTheme } from "@/lib/theme";

/**
 * 亮/暗模式切换按钮（零依赖实现，不依赖 next-themes）。
 *
 * ── 为什么图标不用 React state 控制 ─────────────────────────────
 * 服务端渲染时不知道用户偏好（localStorage 只能在浏览器读）。
 * 如果用 useState / useSyncExternalStore 控制图标显示，
 * 客户端首帧就会和服务端 HTML 不一致 → hydration mismatch。
 *
 * 本组件的做法（shadcn/ui 官方 v4 模板同款）：
 * **两个图标都在 DOM 里，靠 CSS 的 scale/rotate 切换显隐** ——
 * 服务端和客户端渲染出的 HTML 完全一致 → 天然零 hydration 风险。
 *
 * 「当前是不是暗色」这个状态只存在于 <html> 的 class 上，
 * 由 CSS 决定谁可见 —— JS 完全不参与渲染判断。
 *
 * ⚠️ 这里用内联 SVG 而不是 lucide-react —— 本项目刻意不引入图标库，保持零额外依赖。
 */

/** 太阳（暗色模式下显示：点击切回亮色） */
function SunIcon() {
  return (
    <svg
      className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

/** 月亮（亮色模式下显示：点击切到暗色） */
function MoonIcon() {
  return (
    <svg
      className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      title="切换亮色 / 暗色模式"
      className={
        "relative inline-flex h-8 w-8 items-center justify-center rounded-md border " +
        "border-gray-300 transition hover:bg-gray-100 " +
        "dark:border-gray-700 dark:hover:bg-gray-800 " +
        className
      }
    >
      <SunIcon />
      <MoonIcon />
      <span className="sr-only">切换亮色 / 暗色模式</span>
    </button>
  );
}
