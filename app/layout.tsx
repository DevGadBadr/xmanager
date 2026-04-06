import type { Metadata } from "next";

import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemedToaster } from "@/components/theme/themed-toaster";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "XManager",
  description: "Shared workspace for invited teams to manage projects, tasks, updates, and accountability.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-full min-h-dvh bg-[var(--background)] font-sans text-[var(--foreground)] antialiased">
        <AuthProvider>
          <ThemeProvider>
            {children}
            <ThemedToaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
