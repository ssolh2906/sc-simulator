import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { THEME_SCRIPT } from "@/components/layout/ThemeToggle";
import { PipelineProvider } from "@/features/pipeline/PipelineProvider";
import "./globals.css";

const sans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const mono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: { default: "Single-cell Lab", template: "%s · Single-cell Lab" },
  description: "Learn scRNA-seq analysis step by step, on synthetic data modeled on a COVID-19 blood study.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef2f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1514" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="px-4 pt-5 pb-10 font-sans text-[15px] leading-normal antialiased">
        <PipelineProvider>{children}</PipelineProvider>
        <SiteFooter />
      </body>
    </html>
  );
}
