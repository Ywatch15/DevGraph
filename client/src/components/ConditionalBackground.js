"use client";
import { usePathname } from "next/navigation";
import ShaderBackground from "@/components/ui/ShaderBackground";

/**
 * Renders the WebGL shader background on every page EXCEPT the landing page.
 * The landing page has its own Squares canvas background.
 */
export default function ConditionalBackground() {
  const pathname = usePathname();

  // Landing, login and register pages use the Squares/none backgrounds; all other pages use ShaderBackground
  if (pathname === "/" || pathname === "/login" || pathname === "/register") return null;

  return <ShaderBackground />;
}
