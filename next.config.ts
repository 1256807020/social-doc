import type { NextConfig } from "next";
import createMDX from "@next/mdx";

/**
 * MDX 配置 —— 内容引擎基座的唯一必需配置。
 *
 * Turbopack 的硬性限制：loader options 必须【可序列化】，
 * 所以插件必须用【字符串包名】引用，不能传 import 进来的函数
 * （函数无法序列化，会报 "does not have serializable options"）。
 * 插件的【选项】必须是纯 JSON 数据，不能含回调函数。
 */
const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: [
      // 1. 先剥离 YAML frontmatter（否则 --- 会被当 thematic break 渲染出来）
      "remark-frontmatter",
      // 2. 把 frontmatter 转成 ESM 导出：export const frontmatter = {...}
      //    name 不能填 "metadata" —— 该插件会无条件注入导出，
      //    与手写的 export const metadata 撞名报 "Variable name conflict"。
      ["remark-mdx-frontmatter", { name: "frontmatter" }],
      // 3. GitHub Flavored Markdown：表格、删除线、任务列表、自动链接、脚注
      "remark-gfm",
    ],
    rehypePlugins: [
      // 4. 给标题自动加 id（用于锚点目录 / 锚点跳转）
      "rehype-slug",
      // 5. 代码高亮（Shiki，编译期完成，零运行时开销）
      [
        "rehype-pretty-code",
        {
          theme: { dark: "github-dark", light: "github-light" },
          defaultLang: "plaintext",
        },
      ],
    ],
  },
});

const nextConfig: NextConfig = {
  // 必须包含 md / mdx —— 否则 Next 不把它们当页面文件处理
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],

  // 实验性：开启 Cache Components（PPR）
  cacheComponents: true,

  /**
   * 显式声明 Turbopack 的 root。
   *
   * 本项目可能被放在另一个仓库内部（比如作为 monorepo 的子目录），
   * 此时 Next 会扫描到上层目录的 lockfile 并「猜错」workspace root。
   */
  turbopack: {
    root: import.meta.dirname,
  },

  // 站点地址：RSS / sitemap 需要绝对 URL。
  // 生产环境建议用环境变量注入：NEXT_PUBLIC_SITE_URL=https://your-domain.com
};

export default withMDX(nextConfig);
