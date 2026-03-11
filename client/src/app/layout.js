import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import ConditionalBackground from "@/components/ConditionalBackground";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "DevGraph — Personal Developer Knowledge Graph",
  description:
    "Capture, search, connect, and share your programming knowledge. A premium developer second brain.",
  keywords: "developer, knowledge, graph, notes, snippets, bugs, solutions",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Providers>
          <ConditionalBackground />
          {children}
        </Providers>
      </body>
    </html>
  );
}
