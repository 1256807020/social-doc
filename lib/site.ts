/**
 * 站点级常量 —— 多个地方要用（sitemap / robots / RSS / manifest）。
 *
 * 生产环境应该用环境变量注入，Vercel 上配 `NEXT_PUBLIC_SITE_URL` 即可：
 *   NEXT_PUBLIC_SITE_URL=https://your-domain.com
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://next16-sass-beta.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "next16-sass";

export const SITE_DESCRIPTION = "把 App Router 全部核心机制跑一遍的教学型仓库";

export const SITE_LANG = "zh-CN";

/** 把站内路径拼成绝对 URL（RSS / sitemap 必须用绝对地址） */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
