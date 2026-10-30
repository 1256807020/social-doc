import { getAllPostMeta } from "@/lib/posts";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

/**
 * app/rss.xml/route.ts —— RSS 2.0 订阅源。
 *
 * Route Handler 产出 RSS 的好处：**内容变了 feed 自动变**，不用重新生成静态文件。
 * （如果用 `app/rss.xml/route.ts` 之外的静态方案，就得自己写构建脚本。）
 *
 * 三个关键点：
 *  1. `<link>` / `<guid>` 必须是**绝对 URL** —— 订阅器要靠它去抓正文；
 *  2. `<pubDate>` 必须是 **RFC 822** 格式（`new Date().toUTCString()`），不是 ISO 8601；
 *  3. XML 里的 `&`、`<`、`>` 必须转义成 `&amp;` `&lt;` `&gt;`。
 */

/** XML 特殊字符转义 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RFC 822 日期（RSS 2.0 规范要求） */
function toRfc822(date: string | undefined): string {
  const d = date ? new Date(date) : new Date();
  return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

export async function GET() {
  const posts = await getAllPostMeta();

  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/posts/${post.slug}`);
      const categories = (post.tags ?? [])
        .map((tag) => `      <category>${escapeXml(tag)}</category>`)
        .join("\n");

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${toRfc822(post.date)}</pubDate>
      ${post.excerpt ? `<description>${escapeXml(post.excerpt)}</description>` : ""}
${categories}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(absoluteUrl("/"))}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(absoluteUrl("/rss.xml"))}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
