import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Single-cell Lab",
  description: "Learn scRNA-seq analysis step by step on synthetic data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
