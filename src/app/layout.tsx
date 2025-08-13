import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Context Master - Next.js Auth App",
  description: "A modern Next.js application with authentication, Prisma, and SQLite",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
