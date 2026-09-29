import type { Metadata, Viewport } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Experience } from "@/components/three";
import { cms } from "@/lib/cms";
import { MOTION_BOOT_SCRIPT } from "@/lib/motion-preference";
import { buildMetadata } from "@/lib/seo";
import { AppProviders } from "@/providers";
import { archivo } from "./fonts";
import "./globals.css";

export const metadata: Metadata = buildMetadata();

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#07090a",
};

/**
 * Root layout.
 *
 * The WebGL Experience is mounted here rather than inside a page so that it
 * survives navigation — one canvas, one WebGL context, for the whole site.
 *
 * Navigation is read through the CMS interface even though it is served from
 * local data today, so pointing it at WordPress later changes nothing here.
 *
 * `data-scene` starts on the initial product so the first paint is already on
 * the right palette; AnimationProvider keeps it in step after that.
 *
 * `data-motion` is written by the boot script below rather than rendered
 * here, because it depends on the URL and on per-browser storage that the
 * server cannot see.
 */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const navigation = await cms.getNavigation();

  return (
    <html
      lang="en"
      data-scene="green"
      className={archivo.variable}
      /* The boot script below adds `data-motion` before React hydrates, so
         the server's markup and the client's legitimately differ here. */
      suppressHydrationWarning
    >
      <head>
        {/* Resolves ?motion=full before first paint, so the page never
            paints on one preference and then switches to the other. The
            content is a module constant, not interpolated input. */}
        <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT_SCRIPT }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <AppProviders>
          <Experience />
          <SiteHeader navigation={navigation} />
          <div id="site-content">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}
