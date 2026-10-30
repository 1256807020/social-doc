import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * ESLint 扁平配置（Next 16 的写法）。
 *
 * ⚠️ 不要用旧版的 `FlatCompat` 转换法 ——
 *    eslint-config-next v16 的 core-web-vitals / typescript 已经是扁平配置了，
 *    再用 FlatCompat 转换会触发配置校验失败：
 *    "Cannot find package '@eslint/eslintrc'" 或 ConfigValidator 报错。
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
