import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import ConditionalBackground from "@/components/ConditionalBackground";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata = {
  title: "DevGraph — Personal Developer Knowledge Graph",
  description:
    "Capture, search, connect, and share your programming knowledge. A premium developer second brain.",
  keywords: "developer, knowledge, graph, notes, snippets, bugs, solutions",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
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
