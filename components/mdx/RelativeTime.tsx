"use client";

import { useSyncExternalStore } from "react";

/**
 * 相对时间（"3 天前"）—— 必须在客户端算。
 *
 * ⚠️ 为什么不能放服务端？
 *    Cache Components 要求预渲染**完全确定性** ——
 *    服务端渲染时用 `Date.now()` 会被判为 unstable value，构建直接报错：
 *      Error: Next.js encountered the unstable value `Date.now()` while prerendering.
 *
 *    所以服务端输出**绝对日期**（对 SEO 友好），客户端换成相对描述（对读者友好）。
 *    没有 JS 时显示绝对日期 —— 降级行为正确。
 *
 * ⚠️ 为什么用 useSyncExternalStore 而不是 useEffect + setState？
 *    1. React 19 的 `react-hooks/set-state-in-effect` 规则禁止 effect 里同步 setState
 *       （会触发级联渲染）；
 *    2. useSyncExternalStore 正是为「服务端与客户端取值不同」设计的：
 *       getServerSnapshot 返回绝对日期，getSnapshot 返回相对时间，
 *       React 自动在 hydration 后切换，无需手动 setState。
 *
 * ⚠️ getSnapshot 必须返回**稳定引用**，否则会无限重渲染。
 *    所以用模块级缓存：每个 iso 只计算一次（相对时间不需要实时刷新）。
 */
const cache = new Map<string, string>();

function computeRelative(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return iso;

  const diff = Date.now() - then.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "刚刚";
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`;
  if (diff < 365 * day) return `${Math.floor(diff / (30 * day))} 个月前`;
  return `${Math.floor(diff / (365 * day))} 年前`;
}

function getSnapshot(iso: string): string {
  if (!cache.has(iso)) cache.set(iso, computeRelative(iso));
  return cache.get(iso)!;
}

export default function RelativeTime({
  iso,
  prefix = "",
}: {
  /** ISO 日期字符串 */
  iso: string;
  /** 前缀文案（如「最后更新于」） */
  prefix?: string;
}) {
  const relative = useSyncExternalStore(
    () => () => {},
    () => getSnapshot(iso),
    () => iso, // 服务端快照 = 绝对日期
  );

  const isRelative = relative !== iso;

  return (
    <time dateTime={iso} title={iso}>
      {prefix}
      {isRelative ? relative : iso}
    </time>
  );
}
