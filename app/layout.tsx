import type { Metadata } from "next";
import Link from "next/link";
import { ThemeProvider } from "next-themes";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { jsonLdScript, websiteJsonLd } from "@/lib/seo";
import SearchShortcut from "@/components/search/SearchShortcut";
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
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <header className="border-b border-[var(--color-border)]">
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
        </ThemeProvider>
        <footer className="border-t border-[var(--color-border)]">
          <div className="mx-auto max-w-6xl px-4 py-6 text-xs opacity-60 sm:px-6">
            由 Next.js 16 内容引擎基座生成 —— 内容源在{" "}
            <code className="font-mono">content/</code> 目录
          </div>
        </footer>
      </body>
    </html>
  );
}
