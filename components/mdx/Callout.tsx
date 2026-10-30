import type { ReactNode } from "react";

/**
 * MDX 自定义组件 —— 在 .mdx 文件里直接用 <Callout> 就能调用。
 *
 * 原理：MDX 编译后会把用到的组件名交给 mdx-components.tsx 的映射表，
 * 映射表里没有的组件名会报错（除非在 MDX 文件里自己 import）。
 */
export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: "info" | "warn" | "danger";
  title?: string;
  children: ReactNode;
}) {
  const styles = {
    info: "border-sky-300 bg-sky-50 dark:border-sky-700 dark:bg-sky-950",
    warn: "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950",
    danger: "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950",
  }[type];

  const label = { info: "提示", warn: "注意", danger: "警告" }[type];

  return (
    <div className={`my-4 rounded-lg border p-4 text-sm ${styles}`}>
      <p className="mb-1 font-semibold">{title ?? label}</p>
      <div className="[&>p]:m-0">{children}</div>
    </div>
  );
}
