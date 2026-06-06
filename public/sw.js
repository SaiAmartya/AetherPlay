self.addEventListener("install", (event) => {
  // Activate service worker immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Claim all active client tabs immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // If the request points to twoplayergames.org or its subdomains, proxy it locally
  if (
    requestUrl.hostname === "twoplayergames.org" ||
    requestUrl.hostname === "www.twoplayergames.org" ||
    requestUrl.hostname === "files.twoplayergames.org" ||
    requestUrl.hostname === "images.twoplayergames.org"
  ) {
    let proxiedUrl = event.request.url;
    const cleanPath = requestUrl.pathname.replace(/^\//, "");

    if (requestUrl.hostname === "files.twoplayergames.org") {
      proxiedUrl = `${self.location.origin}/api/proxy/${cleanPath}${requestUrl.search}`;
    } else if (requestUrl.hostname === "images.twoplayergames.org") {
      proxiedUrl = `${self.location.origin}/api/proxy-images/${cleanPath}${requestUrl.search}`;
    } else {
      // hostname is twoplayergames.org or www.twoplayergames.org
      if (requestUrl.pathname.startsWith("/dist/")) {
        const distPath = requestUrl.pathname.replace(/^\/dist\//, "");
        proxiedUrl = `${self.location.origin}/api/proxy-dist/${distPath}${requestUrl.search}`;
      } else if (requestUrl.pathname.startsWith("/gameframe/")) {
        const frameSlug = requestUrl.pathname.replace(/^\/gameframe\//, "");
        proxiedUrl = `${self.location.origin}/api/gameframe/${frameSlug}${requestUrl.search}`;
      } else {
        // Fallback for general website files
        proxiedUrl = `${self.location.origin}/api/proxy/${cleanPath}${requestUrl.search}`;
      }
    }

    // Intercept and load from the same-origin proxy
    event.respondWith(
      fetch(
        new Request(proxiedUrl, {
          method: event.request.method,
          headers: event.request.headers,
          credentials: event.request.credentials,
          mode: "cors",
          redirect: "follow",
        })
      )
    );
  }
});
