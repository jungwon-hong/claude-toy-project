import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans, Source_Sans_3 } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { cn } from "@/lib/utils";

const sourceSans3Heading = Source_Sans_3({subsets:['latin'],variable:'--font-heading'});

const ibmPlexSans = IBM_Plex_Sans({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Kanban Todo",
  description: "Kanban board application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning className={cn("font-sans", ibmPlexSans.variable, sourceSans3Heading.variable)}>
      <body className={`${ibmPlexSans.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
