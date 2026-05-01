import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Namma Prani Rescue",
  description: "Quick injured animal reporting with GPS, media uploads, admin dashboard, and Telegram notifications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" style={{ fontFamily: "system-ui, sans-serif" }}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
