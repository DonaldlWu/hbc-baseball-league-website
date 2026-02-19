import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "新和週六野球聯盟",
    short_name: "野球聯盟",
    description: "新和週六野球聯盟統計網站 - 球員資料查詢、統計排行榜、數據視覺化",
    start_url: "/",
    display: "standalone",
    background_color: "#0284c7",
    theme_color: "#0284c7",
    icons: [
      { src: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { src: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
