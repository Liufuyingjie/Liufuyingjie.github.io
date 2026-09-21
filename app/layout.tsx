import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yingjie · Research Notes",
  description: "A personal research notebook for computer vision and image retrieval.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
