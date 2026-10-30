import { createElement } from "react";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * SEO 结构化数据（JSON-LD）。
 *
 * 为什么重要：搜索引擎与 AI 爬虫（Perplexity / GPTBot / ClaudeBot 等）
 * 都优先读 JSON-LD 来理解「这是什么页面、作者是谁、什么时候发的」。
 * 只写 meta description 是不够的。
 *
 * 三种 schema：
 *  - WebSite      → 站点级（含 SearchAction，声明站内搜索）
 *  - Article      → 文章级（标题/作者/发布时间/封面）
 *  - BreadcrumbList → 面包屑（多级分类用）
 */

export type JsonLd = Record<string, unknown>;

/** 站点级 schema：WebSite + SearchAction */
export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    inLanguage: "zh-CN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** 文章级 schema：Article / BlogPosting */
export function articleJsonLd(post: {
  title: string;
  description?: string;
  date?: string;
  updated?: string;
  author?: string;
  tags?: string[];
  slug: string;
  category?: string;
}): JsonLd {
  const url = absoluteUrl(`/posts/${post.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description ?? post.title,
    // 用 datePosted / dateModified 而不是通用的 datePublished
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: {
      "@type": "Person",
      name: post.author ?? SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    keywords: post.tags?.join(", "),
    articleSection: post.category,
    inLanguage: "zh-CN",
  };
}

/** 面包屑 schema：多级分类用 */
export function breadcrumbJsonLd(
  crumbs: { name: string; href: string }[],
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.href),
    })),
  };
}

/**
 * 渲染成 <script type="application/ld+json">。
 *
 * ⚠️ 必须返回 **React 元素**，不能返回字符串！
 *    返回字符串的话，React 会把它当普通文本渲染到页面上（源码里会出现
 *    `dangerouslySetInnerHTML={{ __html: ... }}` 这种字面量），
 *    而真正的 JSON-LD 标签根本不存在 —— 搜索引擎读到的是一段乱码。
 *
 * ⚠️ 用 JSON.stringify 后要转义 `<` —— 否则内容里出现 `</script>` 会提前闭合标签。
 */
export function jsonLdScript(data: JsonLd | JsonLd[]): React.ReactElement {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return createElement("script", {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: json },
  });
}
