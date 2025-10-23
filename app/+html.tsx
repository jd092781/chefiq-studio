// app/+html.tsx
// Web-only root HTML used during static rendering.

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        <style
          // Minimal CSS: keep dark bg and (most important) allow page scroll on mobile web
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root { height: 100%; }
              body {
                margin: 0;
                background: #000;         /* dark background */
                color-scheme: dark;
                overflow-y: auto;          /* ✅ allow vertical scrolling */
                -webkit-overflow-scrolling: touch; /* ✅ smooth iOS scroll */
              }
              @media (prefers-color-scheme: light) {
                body { background: #fff; }
              }
            `,
          }}
        />
      </head>

      <body>
        {children}

        {/* Make sure a stale SW never interferes */}
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
