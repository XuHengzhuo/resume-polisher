import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // 禁用图片优化（静态导出不支持）
  images: {
    unoptimized: true,
  },
  // 确保静态资源路径正确
  trailingSlash: true,
};

export default nextConfig;
