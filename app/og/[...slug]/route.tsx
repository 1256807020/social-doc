import { ImageResponse } from "next/og";
import { getPostMeta } from "@/lib/posts";
import { SITE_NAME } from "@/lib/site";

/**
 * 文章级动态 OG 图。
 *
 * 不能用约定文件 app/posts/[...slug]/opengraph-image.tsx ——
 * Next.js 规定 catch-all 必须是 URL 的最后一段，那样写构建会失败。
 * 所以单独放在 /og/[...slug]，由文章 metadata 指向 /og/<slug>。
 */
// ⚠️ 不能加 `export const runtime` —— 开启 Cache Components 时段级配置被禁用。

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const path = slug.map(decodeURIComponent).join("/");
  const meta = await getPostMeta(path);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 24,
          padding: 80,
          background: "linear-gradient(135deg, #0f1117 0%, #212734 100%)",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.6 }}>{SITE_NAME}</div>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.2 }}>
          {meta?.title ?? path}
        </div>
        <div style={{ fontSize: 28, opacity: 0.7 }}>{meta?.excerpt ?? ""}</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
