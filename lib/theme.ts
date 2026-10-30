/**
 * 零依赖的亮/暗主题切换 —— 替代 `next-themes`。
 *
 * ── 为什么不用 next-themes ──────────────────────────────────────
 * 1. 它只做一件事：把 `class="dark"` 打到 <html> 上 + 管一个 Context。
 *    这件事用 20 行原生 DOM 就能做，引入一个第三方 Provider 不划算。
 * 2. 它的 Context 必须在根布局包一层 Provider，给整棵子树带来额外约束。
 * 3. 本仓库是「内容引擎基座」，主题只是底座上的一层皮 —— 越少依赖越好迁移。
 *
 * ── 实现方式（shadcn/ui 在 Tailwind v4 下的标准做法）────────────
 * · CSS 侧：`@custom-variant dark (&:is(.dark *))` + `:root` / `.dark` 两套 CSS 变量
 * · JS 侧：把 `dark` class 加到 <html> 上 → 变量整体切换
 * · 防闪烁：在 <head> 注入一段内联脚本，**hydration 之前**就把 class 打好
 * · 切换：写 localStorage + 打 class + 派发自定义事件
 *
 * ── 为什么不存 Cookie / 不用服务端读取 ──────────────────────────
 * 服务端读偏好需要 Cookie + 动态渲染，会让整站失去静态能力；
 * 而「首屏闪烁」这个问题用内联脚本就能彻底解决（脚本在 HTML 解析阶段就跑完了）。
 */

/** 用户偏好：light / dark / system（跟随系统） */
export type Theme = "light" | "dark" | "system";

/** 实际生效的主题（system 解析后的结果） */
export type ResolvedTheme = "light" | "dark";

/** localStorage 键名 */
export const THEME_STORAGE_KEY = "theme";

/** 主题变化时派发的 DOM 事件名（供其他组件订阅） */
export const THEME_EVENT = "theme:change";

/** 系统是否偏好暗色 */
export function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * 把主题应用到 <html> 上。
 *
 * 这一步是全部机制的核心 —— Tailwind 的 `dark:` 变体靠 `.dark` 这个类
 * （见 globals.css 里的 `@custom-variant dark (&:is(.dark *))`）。
 */
export function applyTheme(theme: Theme): ResolvedTheme {
  const dark = theme === "dark" || (theme === "system" && systemPrefersDark());
  const root = document.documentElement;

  root.classList.toggle("dark", dark);
  // color-scheme 让浏览器原生 UI（滚动条、表单控件）也跟着变
  root.style.colorScheme = dark ? "dark" : "light";
  // 解析后的实际主题（light/dark）—— CSS 用它决定显示哪个图标
  root.setAttribute("data-theme", dark ? "dark" : "light");
  // 用户原始偏好（可能是 system）—— CSS 用它决定「跟随系统」这一项是否打勾
  root.setAttribute("data-theme-pref", theme);

  return dark ? "dark" : "light";
}

/** 读取用户偏好（localStorage 里的原始值，未解析 system） */
export function getStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    // 隐私模式下 localStorage 可能抛异常
    return "system";
  }
}

/** 读取当前**已生效**的主题（读 DOM，不读 localStorage） */
export function getResolvedTheme(): ResolvedTheme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** 设置并持久化主题（会派发 THEME_EVENT） */
export function setTheme(theme: Theme): ResolvedTheme {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // 存不了就只在本次会话生效
  }
  const resolved = applyTheme(theme);
  window.dispatchEvent(new Event(THEME_EVENT));
  return resolved;
}

/** 在 light / dark 之间切换（用户主动点击按钮时用） */
export function toggleTheme(): ResolvedTheme {
  return setTheme(getResolvedTheme() === "dark" ? "light" : "dark");
}

/**
 * 无闪烁初始化脚本 —— 注入到 <head>，在 React hydration **之前**执行。
 *
 * 它做三件事：
 * 1. 读 localStorage 里的偏好（没有则用 system）
 * 2. 把 `dark` class 打到 <html> 上 → 首屏就是正确的配色，不闪
 * 3. 监听系统偏好变化 —— 当偏好是 system 时实时跟随
 *
 * ⚠️ 为什么必须内联在 <head> 里？
 *    外部脚本是异步加载的，等它下完再执行，页面已经闪了一帧亮色。
 *    内联脚本在 HTML 解析阶段同步执行，时机最早。
 */
export const themeInitScript = `(function(){try{
var K="${THEME_STORAGE_KEY}";
function sys(){return window.matchMedia("(prefers-color-scheme: dark)").matches}
function apply(pref){var d=(pref==="dark")||(pref==="system"&&sys());var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";r.setAttribute("data-theme",d?"dark":"light");r.setAttribute("data-theme-pref",pref)}
function pref(){var v=localStorage.getItem(K);return (v==="light"||v==="dark"||v==="system")?v:"system"}
apply(pref());
var mq=window.matchMedia("(prefers-color-scheme: dark)");
if(mq&&mq.addEventListener){mq.addEventListener("change",function(){if(pref()==="system"){apply("system")}})}
}catch(e){}})();`;
