# 内容引擎基座 · doc-engine

> **文章站 / 博客站 / 文档站的内容层** —— 把 `.md` / `.mdx` 丢进 `content/` 即成文章。
>
> 零框架依赖（只用 Next.js 官方 `@next/mdx` + unified 插件链），不绑 Fumadocs / Nextra，
> 不绑 CMS，不绑数据库。

```text
content/tech/ssg.mdx  ──▶  /posts/tech/ssg      文章详情（多级路径）
                       ──▶  /category/tech        分类页
                       ──▶  /tags/Next.js         标签页
                       ──▶  /search?q=缓存         全文搜索
                       ──▶  /rss.xml              订阅源
                       ──▶  /archive              按年月归档
```

---

## 快速开始

```bash
pnpm install
pnpm dev          # → http://localhost:3000
```

部署前请设置站点地址（RSS / sitemap / OG 图都需要绝对 URL）：

```bash
cp .env.example .env.local
# 编辑 .env.local，把 NEXT_PUBLIC_SITE_URL 改成你的域名
```

---

## 它自带了什么（28 项能力）

### 内容组织

| 能力 | 说明 |
|---|---|
| 文章路由（任意深度） | `content/a/b/c.mdx` → `/posts/a/b/c`，catch-all 承担 |
| 多级分类 | 目录即分类，分类页带面包屑与子分类导航 |
| 路径分页 | `/posts/page/2`，静态生成，每页独立 URL（SEO 友好） |
| 标签页 | frontmatter `tags` → `/tags/<tag>`，中文标签正常 |
| 归档页 | `/archive` 按年月分组全部文章 |
| 作者页 | `/author/<name>`，作者来自 frontmatter `author` |
| 草稿机制 | `draft: true` → 不生成路由、不进列表 / RSS / 标签页 |
| YAML frontmatter | `.md` 与 `.mdx` 通用 |

### SEO

| 能力 | 说明 |
|---|---|
| JSON-LD | `WebSite`（含 SearchAction）+ `BlogPosting` + `BreadcrumbList` |
| 文章级动态 OG 图 | `/og/<slug>` → 1200×630 PNG，带标题/摘要/分类 |
| canonical | 每篇文章声明 `alternates.canonical` |
| Open Graph / Twitter | `article` 类型 + `summary_large_image` |
| sitemap | 含全部文章 + 静态页，`lastModified` 跟着 `updated` 走 |
| robots.txt | 屏蔽 `/search`；对 GPTBot / ClaudeBot / PerplexityBot 明确放开 |
| 语义化 HTML | `<article>` / `<time>` / `<nav aria-label="面包屑">` |
| llms.txt | 站点导航 + 全部文章的 Markdown 摘要（AI 爬虫友好） |

### 阅读体验

| 能力 | 说明 |
|---|---|
| 目录（TOC） | 构建期从 Markdown 解析，锚点与正文标题**完全一致**；滚动高亮 + 吸顶 |
| 阅读时长 | 中英加权公式（中文 350 字/分、英文 220 词/分），不是「词数/200」 |
| 相关文章 | 按**共同标签数**排序，比「同分类」更精准 |
| 上一篇 / 下一篇 | 按日期排序取相邻，首篇无上一篇、末篇无下一篇 |
| 搜索快捷键 | `/` 聚焦、`⌘K`/`Ctrl+K` 跳转、`Esc` 清空 |
| 搜索可分享 | `/search?q=xxx`，结果链接能直接发给别人 |
| 代码块复制 | 客户端注入按钮，无 JS 时降级为纯代码块 |
| 代码高亮 | Shiki，**编译期**完成，零运行时开销 |
| 标题锚点 | `rehype-slug` 自动生成 id |
| 暗色模式 | `next-themes`，跟随系统 + 手动切换 |

### 检索与订阅

| 能力 | 说明 |
|---|---|
| 全文搜索 | **中文子串匹配**（可靠）+ Fuse.js 模糊匹配（英文容错） |
| RSS 2.0 | 含 `atom:link` 自引用 + 标签作为 `category` |
| RSS 自动发现 | 根 layout 的 `alternates.types`，阅读器自动发现 |
| 最后编辑时间 | Git 时间兜底 + 相对时间（SEO 用绝对日期） |

---

## 写文章

在 `content/` 下新建 `.md` 或 `.mdx`，用 YAML frontmatter 声明元数据：

```md
---
title: "标题"
date: "2026-11-03"
excerpt: "摘要（会显示在列表页）"
tags: ["标签一", "标签二"]
author: "作者名"
draft: false
---

# 正文

支持 **Markdown** 与 JSX。
```

- 放进 `content/tech/` 就归到「tech」分类 → `/category/tech`
- `draft: true` 的文章不会生成路由、不进列表 / RSS / 标签页
- **`.md` 不支持 JSX**（但 YAML frontmatter 两者都支持）→ 要用组件就存成 `.mdx`
- 分类的显示名与描述放 `content/tech/_meta.json`

```json
{
  "name": "技术",
  "description": "工程实践与踩坑记录"
}
```

### 自定义组件

```mdx
<Callout type="warn" title="注意">
  在 `mdx-components.tsx` 里登记后直接用，作者不需要 import 任何东西。
</Callout>
```

---

## 目录结构

```text
.
├─ app/
│  ├─ layout.tsx                 根布局（RSS 自动发现 + 站点级 JSON-LD）
│  ├─ globals.css                Tailwind v4 + typography 插件
│  ├─ page.tsx                   首页
│  ├─ posts/
│  │  ├─ page.tsx                文章列表（分类/标签导航 + 搜索框）
│  │  ├─ [...slug]/page.tsx      文章详情（JSON-LD / TOC / 阅读时长 / 相关文章）
│  │  └─ page/[n]/page.tsx       分页
│  ├─ category/[...category]/     分类页（多级 + 面包屑）
│  ├─ tags/page.tsx              标签索引
│  ├─ tags/[tag]/page.tsx        单标签页
│  ├─ author/[name]/page.tsx     作者页
│  ├─ archive/page.tsx           归档页
│  ├─ search/page.tsx            搜索页
│  ├─ search/SearchClient.tsx    搜索交互（客户端）
│  ├─ og/[...slug]/route.tsx     动态 OG 图
│  └─ rss.xml/route.ts           RSS 2.0
├─ lib/
│  ├─ posts.ts                   ★ 核心：扫描 / 元数据 / 分类树 / 草稿 / 分页
│  ├─ seo.ts                     JSON-LD 生成器
│  ├─ search.ts                  搜索索引 + Markdown → 纯文本
│  ├─ toc.ts                     目录提取（remark + github-slugger）
│  ├─ reading-time.ts            阅读时长
│  ├─ git.ts                     Git 最后编辑时间
│  └─ site.ts                    站点常量
├─ components/
│  ├─ toc/index.tsx              目录（滚动高亮 + 吸顶）
│  ├─ search/SearchBox.tsx      搜索框
│  ├─ search/SearchShortcut.tsx  全站快捷键
│  ├─ theme/ThemeToggle.tsx      暗色模式切换
│  └─ mdx/                       Callout / CodeCopy / RelativeTime
├─ content/                      ← ★ 你的文章放这里
├─ mdx-components.tsx            MDX 组件映射表
└─ next.config.ts                MDX 启用 + 插件链
```

---

## 改成你自己的站

| # | 位置 | 改什么 |
|---|---|---|
| 1 | `lib/site.ts` | 站点名 / 描述；`SITE_URL` 建议用 `NEXT_PUBLIC_SITE_URL` 注入 |
| 2 | `app/globals.css` | 主题色变量（`--color-*`）、字体（`next/font`） |
| 3 | `content/` | 删掉示例文章，换成你自己的 |
| 4 | 路由前缀 | `/posts` → `/blog` 等：改目录名 + 页面里的 `href` 即可 |

### 换掉搜索方案

现在的搜索是「中文子串匹配 + Fuse.js 英文容错」，零配置、可靠。
文章上千篇后如果需要拼音/容错检索，把 `lib/search.ts` 的输出改成
「构建期生成静态 JSON + 客户端按需 fetch」，再换 Orama / FlexSearch 即可。

---

## 环境要求

- Node.js ≥ 20.9
- Next.js 16（Turbopack）

## 与 next16-sass 的关系

本项目是从 [`next16-sass`](https://github.com/next16-sass) 的「第十一章 · 内容引擎基座」
**独立抽出的可运行实例** —— 用它证明那套架构真的可以单独跑起来。
原仓库保留的是「教学实验田」（Next.js 各种机制的对照样本与踩坑记录）。

## License

MIT
