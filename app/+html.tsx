// app/+html.tsx
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

        {/* Force the document to be scrollable and touch-scroll friendly */}
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: globalCSS }}
        />
      </head>
      <body>
        {children}

        {/* Nuke any stale service worker that could serve old CSS/JS */}
        <script
          // eslint-disable-next-line react/no-danger
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

const globalCSS = `
  html, body, #root { min-height: 100%; }
  body {
    margin: 0;
    background: #000;
    color-scheme: dark;
    /* ✅ absolutely ensure the page can scroll */
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
  }
  @media (prefers-color-scheme: light) {
    body { background: #fff; }
  }
`;
