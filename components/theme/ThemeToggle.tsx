"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

/**
 * 暗色模式切换按钮。
 *
 * Fumadocs / Nextra / Docusaurus 都有 —— 内容站的标配。
 *
 * ⚠️ 为什么需要 `mounted` 判断？
 *    服务端渲染时不知道用户的主题偏好（localStorage 只能在浏览器读），
 *    如果直接渲染对应图标的 button，HTML 与客户端首帧不一致 → 水合报错。
 *
 *    用 useSyncExternalStore 而不是 useEffect + setState：
 *    前者在服务端返回 getServerSnapshot（false）、
 *    客户端返回 getSnapshot（true），天然区分「服务端」与「客户端」，
 *    且不会触发 react-hooks/set-state-in-effect 这条规则。
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  // 服务端 false / 客户端 true —— 用于避免水合不一致
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "切换到亮色模式" : "切换到暗色模式"}
      title={isDark ? "切换到亮色模式" : "切换到暗色模式"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={
        "inline-flex h-8 w-8 items-center justify-center rounded-md border " +
        "border-gray-300 text-sm transition hover:bg-gray-100 " +
        "dark:border-gray-700 dark:hover:bg-gray-800 " +
        className
      }
    >
      {mounted ? (
        isDark ? (
          <span aria-hidden>☀</span>
        ) : (
          <span aria-hidden>☾</span>
        )
      ) : (
        <span aria-hidden style={{ opacity: 0.4 }}>
          ◐
        </span>
      )}
    </button>
  );
}
