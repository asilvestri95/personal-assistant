import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Assistant",
  description: "Your personal productivity hub",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg text-text">{children}</body>
    </html>
  );
}
