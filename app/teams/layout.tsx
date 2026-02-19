import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#0284c7",
};

export default function TeamsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
