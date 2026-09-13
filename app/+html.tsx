import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * Custom static HTML shell for web. Declares both color schemes so the page
 * background matches the browser theme from the very first paint — without
 * this, dark mode starts with a white flash until React hydrates.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        {/* Let form controls / scrollbars follow the browser theme */}
        <meta name="color-scheme" content="light dark" />
        <ScrollViewStyleReset />
        {/* Page background matches slate-50 / neutral-900 before hydration */}
        <style
          dangerouslySetInnerHTML={{
            __html: `html, body { background-color: #f8fafc; }
@media (prefers-color-scheme: dark) { html, body { background-color: #171717; } }`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
