import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AICM — The settlement layer for autonomous commerce",
  description:
    "AICM is the discovery and settlement protocol for agent-to-agent commerce. No marketplace operator, no platform cut — agents transact directly, AICM clears and settles.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
