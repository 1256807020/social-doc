import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { jsonLdScript, websiteJsonLd } from "@/lib/seo";
import SearchShortcut from "@/components/search/SearchShortcut";
import ThemeScript from "@/components/theme/ThemeScript";
import ThemeToggle from "@/components/theme/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  /**
   * RSS 自动发现 —— 阅读器扫到这一行就知道 feed 在哪。
   * 少了这一行，订阅者得手填 /rss.xml 地址。
   */
  alternates: {
    types: {
      "application/rss+xml": [{ url: "/rss.xml", title: `${SITE_NAME} RSS` }],
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /*
      suppressHydrationWarning —— 必须加，否则报 hydration mismatch。

      原因：<html> 上的 class（dark）与 style（color-scheme）是由
      ThemeScript 的**内联脚本**在浏览器端根据 localStorage / 系统偏好
      动态设置的。而服务端渲染时不知道用户的主题 → 两边属性不一致
      → React 报「A tree hydrated but some attributes of the server
      rendered HTML didn't match the client properties」。

      这个属性只压制 <html> **自身**属性的警告，不影响任何子节点。
    */
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/*
          主题初始化脚本 —— 必须内联在 <head> 且在 hydration 之前执行，
          这样首屏就是用户上次选的配色，不会闪一下亮色再变暗。
        */}
        <ThemeScript />
      </head>
      <body className="min-h-screen antialiased">
        <header className="border-b border-[var(--border)]">
          <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 text-sm sm:px-6">
            <Link href="/" className="font-bold">
              {SITE_NAME}
            </Link>
            <Link href="/posts" className="opacity-70 hover:opacity-100">
              文章
            </Link>
            <Link href="/search" className="opacity-70 hover:opacity-100">
              搜索
            </Link>
            <Link href="/tags" className="opacity-70 hover:opacity-100">
              标签
            </Link>
            <Link href="/archive" className="opacity-70 hover:opacity-100">
              归档
            </Link>
            <Link href="/rss.xml" className="ml-auto opacity-70 hover:opacity-100">
              RSS
            </Link>
            <ThemeToggle />
          </nav>
        </header>
        {/* 全站搜索快捷键（/ 聚焦 · ⌘K 跳转） */}
        <SearchShortcut />

        {/* 站点级 JSON-LD：WebSite + SearchAction（声明站内搜索） */}
        {jsonLdScript(websiteJsonLd())}

        <main className="px-4 py-8 sm:px-6">{children}</main>

        <footer className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-6xl px-4 py-6 text-xs opacity-60 sm:px-6">
            由 Next.js 16 内容引擎基座生成 —— 内容源在{" "}
            <code className="font-mono">content/</code> 目录
          </div>
        </footer>
      </body>
    </html>
  );
}
