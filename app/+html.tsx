// app/+html.tsx
import React from "react";
// NOTE: We intentionally DO NOT import ScrollViewStyleReset here.
// That util disables <body> scrolling, which was preventing pages from
// scrolling on the web build.

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* Keep the background from flashing between routes */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root, #__next {
                height: auto;
                min-height: 100vh;
              }
              /* RE-ENABLE body scrolling on web */
              body {
                overflow-y: auto !important;
                background-color: #000;
              }
              @media (prefers-color-scheme: light) {
                body { background-color: #fff; }
              }
            `,
          }}
        />
      </head>

      <body>
        {children}

        {/* Make sure no rogue service worker caches old bundles */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations?.()
                  .then(rs => rs.forEach(r => r.unregister()))
                  .catch(()=>{});
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
