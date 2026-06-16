import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blog/", "/seller/"],
        disallow: [
          "/api/",
          "/admin/",
          "/auth",
          "/dashboard",
          "/wallet",
          "/create",
          "/profile",
          "/history",
          "/orderlink/",
          "/pay/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
