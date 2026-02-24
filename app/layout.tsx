import type { ReactNode } from "react";

// Root layout: minimal shell — actual <html> is in [locale]/layout.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
