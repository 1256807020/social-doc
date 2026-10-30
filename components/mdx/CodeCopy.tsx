"use client";

import { useEffect } from "react";

/**
 * 代码块「复制」按钮 —— 纯客户端增强，不改编译链。
 *
 * 为什么用 DOM 注入而不是 rehype 插件？
 * rehype-pretty-code 产出的是纯 HTML（`pre > code > span`），
 * 要把它变成带交互的 React 组件需要 **rehype + recma 两级插件**（把 hast 换成 JSX），
 * 成本与心智负担都高。而「复制按钮」本质是**渐进增强**：
 * 没有 JS 时代码块照常显示，只是没有按钮 —— 降级行为完美。
 *
 * 实现要点：
 *  - 用 `data-code-copy` 标记，避免重复注入（React 严格模式下 effect 会跑两次）
 *  - 用 `pre.innerText` 取代码（span 里是纯文本，不含样式标记）
 *  - 用 MutationObserver 监听内容变化（SPA 导航后新页面也要注入）
 */
export default function CodeCopy() {
  useEffect(() => {
    const BUTTON_CLASS =
      "absolute right-2 top-2 rounded border border-white/20 bg-white/10 px-2 py-1 " +
      "text-[11px] text-white opacity-0 transition group-hover:opacity-100 " +
      "hover:bg-white/20 focus:opacity-100";

    function inject() {
      document.querySelectorAll("pre").forEach((pre) => {
        if (pre.querySelector("[data-code-copy]")) return;

        // 让 pre 成为定位容器，按钮才能贴右上角
        pre.classList.add("group", "relative");

        const button = document.createElement("button");
        button.setAttribute("data-code-copy", "");
        button.setAttribute("type", "button");
        button.setAttribute("aria-label", "复制代码");
        button.className = BUTTON_CLASS;
        button.textContent = "复制";

        button.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(pre.innerText.replace(/\n$/, ""));
            button.textContent = "已复制";
            setTimeout(() => (button.textContent = "复制"), 1600);
          } catch {
            button.textContent = "复制失败";
            setTimeout(() => (button.textContent = "复制"), 1600);
          }
        });

        pre.appendChild(button);
      });
    }

    inject();

    // SPA 导航后页面内容替换，需要重新注入
    const observer = new MutationObserver(() => inject());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
