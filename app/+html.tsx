import { ScrollViewStyleReset } from "expo-router/html";

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.

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

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Background color + iOS scrolling fixes */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                height: 100%;
                overscroll-behavior: none;
              }

              /* Enable smooth momentum scrolling on iOS Safari */
              * {
                -webkit-overflow-scrolling: touch;
              }

              body {
                background-color: #fff;
              }

              @media (prefers-color-scheme: dark) {
                body {
                  background-color: #000;
                }
              }
            `,
          }}
        />
      </head>

      <body>
        {children}

        {/* Unregister any old Expo service workers that might interfere */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker
                  .getRegistrations()
                  .then((rs) => rs.forEach((r) => r.unregister()))
                  .catch(() => {});
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
