import type { MetadataRoute } from "next";
import { getAllPostMeta, getAuthors } from "@/lib/posts";
import { absoluteUrl } from "@/lib/site";

/**
 * app/sitemap.ts —— 约定文件，自动产出 /sitemap.xml。
 *
 * ⚠️ 一个 sitemap 的 URL 上限是 50000、文章最多 1000 条/页（每页 50KB）。
 *    文章多了要**分片**：产出 sitemap index（/sitemap.xml）+ 子 sitemap。
 *
 * 本仓库当前文章量小，用单文件；但结构上留了分片的接口，
 * 超过阈值时把 staticRoutes 拆出去即可。
 */

/** 超过这个数量就分片 */
const MAX_URLS = 1000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPostMeta();

  const staticRoutes = [
    { url: absoluteUrl(""), priority: 1, changeFrequency: "daily" as const },
    { url: absoluteUrl("/posts"), priority: 0.9, changeFrequency: "daily" as const },
    { url: absoluteUrl("/archive"), priority: 0.6, changeFrequency: "weekly" as const },
    { url: absoluteUrl("/tags"), priority: 0.6, changeFrequency: "weekly" as const },
    { url: absoluteUrl("/search"), priority: 0.3, changeFrequency: "monthly" as const },
    { url: absoluteUrl("/llms.txt"), priority: 0.5, changeFrequency: "weekly" as const },
    { url: absoluteUrl("/knowledge"), priority: 0.7, changeFrequency: "weekly" as const },
  ];

  const postRoutes = posts.map((post) => ({
    url: absoluteUrl(`/posts/${post.slug}`),
    lastModified: post.updated ?? post.date ? new Date(post.updated ?? post.date!) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // 作者页
  const authorRoutes = (await getAuthors()).map((a) => ({
    url: absoluteUrl(`/author/${encodeURIComponent(a.name)}`),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  const all = [...staticRoutes, ...postRoutes, ...authorRoutes];

  // 未来文章很多时：这里返回 sitemap index 的子项即可
  return all.slice(0, MAX_URLS);
}
