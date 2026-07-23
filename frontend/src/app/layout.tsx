import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "async | Advanced Data Analyst Dashboard",
  description: "A premium data analyst platform featuring interactive charts, custom LLM models, and ML analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
