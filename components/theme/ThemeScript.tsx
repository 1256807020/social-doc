import { themeInitScript } from "@/lib/theme";

/**
 * 主题初始化脚本 —— 必须内联在 <head> 里。
 *
 * 它在 React hydration **之前**同步执行，把 `dark` class 打到 <html> 上，
 * 所以首屏就是用户上次选的配色，**不会闪一下亮色再变暗**。
 *
 * ⚠️ 为什么不能用 next/script 的 <Script>？
 *    next/script 默认异步加载，等它下完执行，页面已经闪了一帧。
 *    内联脚本在 HTML 解析阶段就执行，时机最早。
 *
 * ⚠️ 为什么 <html> 还要 suppressHydrationWarning？
 *    因为这个 class 是**客户端脚本**加的，而服务端渲染时不知道用户偏好
 *    （服务端渲染出的是「无 class」的 html）→ 两边属性不一致 → React 会警告。
 *    这个属性只压制 <html> 自身属性的警告，不影响子节点。
 */
export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />;
}
