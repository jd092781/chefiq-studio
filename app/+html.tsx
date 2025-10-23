// app/+html.tsx
// Web-only root HTML used during static rendering.
// IMPORTANT: Do NOT import ScrollViewStyleReset from 'expo-router/html' here.

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
          dangerouslySetInnerHTML={{
            __html: `
              /* Make the page actually scroll on iOS/Android browsers */
              html, body, #root, #__next { height: 100%; }
              body {
                margin: 0;
                background: #000;                 /* dark background */
                color-scheme: dark;
                overflow-y: auto !important;      /* ✅ allow vertical scrolling */
                -webkit-overflow-scrolling: touch;/* ✅ smooth iOS scroll */
              }

              /* Extra safety: never hide scroll via overflow on html element */
              html { overflow-y: auto !important; }

              @media (prefers-color-scheme: light) {
                body { background: #fff; }
              }
            `,
          }}
        />
      </head>

      <body>
        {children}

        {/* Kill any stale service workers that could freeze assets / CSS */}
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
