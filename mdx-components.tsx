import type { MDXComponents } from "mdx/types";
import { Callout } from "@/components/mdx/Callout";

/**
 * MDX 组件映射表。
 *
 * MDX 编译时会把 JSX 里用到的【标签名】映射到这里：
 *   - 映射表里有的 → 换成你的组件（下面把 h1/h2/a 都接管了）
 *   - 映射表里没有的 → 渲染成原生 HTML 标签
 *   - 想在文章里用自定义组件，把组件名加进映射表即可（见 Callout）
 *
 * 这就是「Markdown 里写 JSX」的扩展点 —— 文章作者不用 import 任何东西。
 */
const components: MDXComponents = {
  // 正文标题接管：统一字号与间距
  h1: (props) => <h1 className="mb-3 mt-8 text-2xl font-bold" {...props} />,
  h2: (props) => <h2 className="mb-2 mt-6 text-xl font-semibold" {...props} />,
  h3: (props) => <h3 className="mb-2 mt-5 text-lg font-semibold" {...props} />,

  // 链接接管：站内链接用 Next 的 Link，外链加 target
  a: ({ href = "", children, ...props }) =>
    href.startsWith("/") ? (
      <a href={href} className="text-blue-600 underline underline-offset-4 dark:text-blue-400" {...props}>
        {children}
      </a>
    ) : (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-blue-600 underline underline-offset-4 dark:text-blue-400"
        {...props}
      >
        {children}
      </a>
    ),

  // 自定义组件：文章里直接写 <Callout type="warn">…</Callout>
  Callout,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
