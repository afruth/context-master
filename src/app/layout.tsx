import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { CommandPaletteProvider } from "@/components/providers/command-palette-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PWAInstallPrompt } from "@/components/pwa/install-prompt";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker";

export const metadata: Metadata = {
  title: "Collaborative Todo Application",
  description: "A modern task management platform for personal productivity and team collaboration",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Todo App",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Todo App",
    title: "Collaborative Todo Application",
    description: "A modern task management platform for personal productivity and team collaboration",
  },
  icons: {
    shortcut: "/icon.svg",
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'light';
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const actualTheme = theme === 'system' ? systemTheme : theme;
                document.documentElement.className = actualTheme;
                document.documentElement.style.colorScheme = actualTheme;
              } catch (e) {}
            `,
          }}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Todo App" />
        <meta name="application-name" content="Todo App" />
        <meta name="msapplication-TileColor" content="#06b6d4" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="theme-color" content="#06b6d4" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="mask-icon" href="/icon.svg" color="#06b6d4" />
      </head>
      <body className="antialiased">
        <QueryProvider>
          <ThemeProvider>
            <CommandPaletteProvider>
              {children}
              <ToastProvider />
              <PWAInstallPrompt />
              <ServiceWorkerRegistration />
            </CommandPaletteProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
