import Link from "next/link";
import { Suspense } from "react";
import { buildSearchIndex } from "@/lib/search";
import SearchClient from "./SearchClient";

/**
 * 全文搜索页 `/search`。
 *
 * 索引在【构建期】算好（Server Component 里 buildSearchIndex()），
 * 直接内联进页面传给客户端组件 ——
 *   - 零额外请求，首屏就能搜
 *   - 不用维护一个 /api/search-index 接口
 *
 * ⚠️ 索引会随文章数量线性变大。几百篇以后建议改成
 *    「构建期生成静态 JSON + 客户端按需 fetch」。
 */
export default async function SearchPage() {
  const docs = await buildSearchIndex();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <header>
        <h1 className="text-3xl font-bold">搜索</h1>
        <p className="mt-2 text-sm opacity-70">
          中文按【子串匹配】搜（可靠），英文额外走{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-gray-800">
            Fuse.js
          </code>{" "}
          模糊匹配（容错拼写）。
        </p>
      </header>

      <div className="mt-6">
        {/* ⚠️ SearchClient 用了 useSearchParams（读 ?q=），
            静态预渲染的页面必须用 <Suspense> 包住，否则构建报
            "useSearchParams() should be wrapped in a suspense boundary"。 */}
        <Suspense fallback={<div className="text-sm opacity-60">读取搜索词…</div>}>
          <SearchClient docs={docs} />
        </Suspense>
      </div>

      <p className="mt-10 text-sm">
        <Link href="/posts" className="underline">
          ← 返回文章列表
        </Link>
      </p>
    </div>
  );
}
