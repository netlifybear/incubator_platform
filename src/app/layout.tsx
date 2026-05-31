import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Incubator Trust Platform",
  description: "Private cohort-verified vendor recommendations for startup founders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
