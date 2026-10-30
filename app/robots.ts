import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * app/robots.ts —— 约定文件，自动产出 /robots.txt。
 *
 * 告诉爬虫哪些路径可以抓、哪些不要抓，并在最后附上 sitemap 地址。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // 搜索页没有独立内容价值（内容是索引出来的），不必收录
        disallow: ["/api/", "/basic/", "/mycache", "/search"],
      },
      // AI 爬虫：明确允许（想让 AI 引用你的内容就放开）
      {
        userAgent: ["GPTBot", "ClaudeBot", "PerplexityBot"],
        allow: "/",
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl(""),
  };
}
