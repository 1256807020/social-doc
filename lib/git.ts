import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * Git 最后编辑时间 —— 让读者知道内容有多新鲜。
 *
 * Docusaurus / Fumadocs 都有这个能力（「最后更新于 3 天前」）。
 * 对技术文档尤其重要 —— 读者需要判断「这段内容是不是已经过时了」。
 *
 * ⚠️ 三个现实约束：
 *  1. 部署平台（Vercel 等）可能没有 `.git` 目录 → 必须容错；
 *  2. 这是**构建期**调用（不是运行时），所以只影响静态页；
 *  3. 未提交的文件查不到 → 返回 undefined（前端不显示）。
 */
export function getLastGitModified(file: string): string | undefined {
  try {
    const rel = path.relative(process.cwd(), path.join(process.cwd(), "content", file));
    const out = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", rel],
      {
        cwd: process.cwd(),
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 3000,
      },
    ).trim();
    return out || undefined;
  } catch {
    // 没有 git、没有 .git、超时 —— 一律静默降级
    return undefined;
  }
}
