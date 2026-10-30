import { getAllPostMeta } from "@/lib/posts";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

/**
 * app/llms.txt/route.ts —— 给 AI 爬虫的站点摘要。
 *
 * 背景：2025 年起越来越多的「llms.txt」约定出现 —— 网站主动提供一份
 * Markdown 格式的「站点导航 + 内容摘要」，让 LLM（Perplexity / GPTBot /
 * ClaudeBot 等）能一次性拿到全站结构，而不用逐页爬。
 *
 * Fumadocs / Nextra 等新版本都把它做成了标准约定文件。
 *
 * 格式（llmstxt.org 约定）：
 *   # 站点名
 *   > 一句话描述
 *   ## 分类 / 分区
 *   - [标题](绝对URL): 摘要
 *
 * ⚠️ 必须用**绝对 URL** —— AI 爬虫是按 URL 抓取的，相对路径没用。
 */
export async function GET() {
  const posts = await getAllPostMeta();

  // 按分类分组
  const groups = new Map<string, typeof posts>();
  for (const post of posts) {
    const key = post.category ?? "文章";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(post);
  }

  const sections = [...groups.entries()]
    .map(([name, items]) => {
      const lines = items.map((p) => {
        const url = absoluteUrl(`/posts/${p.slug}`);
        return `- [${p.title}](${url})${p.excerpt ? `: ${p.excerpt}` : ""}`;
      });
      return `## ${name}\n\n${lines.join("\n")}\n`;
    })
    .join("\n");

  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

本站共 ${posts.length} 篇文章。内容源为仓库内的 Markdown / MDX 文件，
每篇文章的完整正文见对应链接。

${sections}
## 站点地图

- ${absoluteUrl("/posts")} —— 全部文章列表
- ${absoluteUrl("/archive")} —— 按年月归档
- ${absoluteUrl("/tags")} —— 标签索引
- ${absoluteUrl("/rss.xml")} —— RSS 订阅源
- ${absoluteUrl("/sitemap.xml")} —— XML 站点地图
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
