import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * 阅读时长估算。
 *
 * 中文和英文的阅读速度不同，「按词数算」对中文不准。
 * 这里用加权公式：中文按字数、英文按词数，各按不同速度折算。
 *
 * 依据：中文成人默读约 300~500 字/分钟，英文约 200~250 词/分钟。
 */
export function calcReadingTime(markdown: string): {
  minutes: number;
  text: string;
  words: number;
  cjk: number;
} {
  const plain = markdown
    // 去掉代码块（代码的阅读速度与散文不同）
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    // 去掉标记符号
    .replace(/[#>*_[\]()~-]/g, "");

  const cjk = (plain.match(/[\u4e00-\u9fa5\u3040-\u30ff]/g) ?? []).length;
  const words = (plain.match(/[a-zA-Z0-9]+/g) ?? []).length;

  // 中文 350 字/分钟，英文 220 词/分钟
  const minutes = cjk / 350 + words / 220;
  const rounded = Math.max(1, Math.round(minutes));

  return {
    minutes: rounded,
    text: `${rounded} 分钟`,
    words,
    cjk,
  };
}

/** 从 content/ 读源文件并算阅读时长（构建期调用） */
export function getReadingTime(file: string): ReturnType<typeof calcReadingTime> {
  try {
    const full = path.join(process.cwd(), "content", file);
    const { content } = matter(fs.readFileSync(full, "utf-8"));
    return calcReadingTime(content);
  } catch {
    return { minutes: 1, text: "1 分钟", words: 0, cjk: 0 };
  }
}
