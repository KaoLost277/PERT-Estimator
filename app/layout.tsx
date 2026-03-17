import type { Metadata } from "next";
import "./globals.css";
import { ProjectProvider } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "PERT & Critical Path Estimator",
  description: "Advanced project estimation tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased text-foreground bg-background leading-relaxed">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ProjectProvider>
            <div className="flex flex-col md:flex-row min-h-screen md:h-screen md:overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-auto bg-gradient-page min-w-0">
                <div className="w-full px-4 py-6 sm:px-6 md:px-8 md:py-8">
                  {children}
                </div>
              </main>
            </div>
          </ProjectProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
