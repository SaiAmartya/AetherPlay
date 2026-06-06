import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");
  const { searchParams } = new URL(request.url);
  const searchStr = searchParams.toString();
  
  const targetUrl = `https://files.twoplayergames.org/${path}${searchStr ? "?" + searchStr : ""}`;

  // Forward the Range header if present
  const requestHeaders = new Headers();
  requestHeaders.set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
  
  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    requestHeaders.set("Range", rangeHeader);
  }

  try {
    const response = await fetch(targetUrl, {
      headers: requestHeaders,
    });

    if (!response.ok && response.status !== 206) {
      return new Response(`Failed to fetch asset from source: ${response.statusText}`, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "";
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", contentType);

    // Forward range response headers
    const contentRange = response.headers.get("content-range");
    if (contentRange) responseHeaders.set("Content-Range", contentRange);

    const contentLength = response.headers.get("content-length");
    if (contentLength) responseHeaders.set("Content-Length", contentLength);

    const acceptRanges = response.headers.get("accept-ranges");
    if (acceptRanges) responseHeaders.set("Accept-Ranges", acceptRanges);

    const cacheControl = response.headers.get("cache-control");
    if (cacheControl) responseHeaders.set("Cache-Control", cacheControl);

    // Determine extension to assist in text detection
    const lowerPath = path.toLowerCase();
    const isTextAsset = 
      contentType.includes("text/") ||
      contentType.includes("application/javascript") ||
      contentType.includes("application/x-javascript") ||
      contentType.includes("application/json") ||
      lowerPath.endsWith(".html") || 
      lowerPath.endsWith(".js") || 
      lowerPath.endsWith(".json");

    // Don't modify unityweb/wasm/data binary files even if they contain text-like content-types
    const isBinaryExtension = 
      lowerPath.endsWith(".wasm") || 
      lowerPath.endsWith(".unityweb") || 
      lowerPath.endsWith(".data") ||
      lowerPath.endsWith(".mp3") ||
      lowerPath.endsWith(".ogg") ||
      lowerPath.endsWith(".wav") ||
      lowerPath.endsWith(".png") ||
      lowerPath.endsWith(".jpg") ||
      lowerPath.endsWith(".jpeg") ||
      lowerPath.endsWith(".gif");

    if (isTextAsset && !isBinaryExtension) {
      let bodyText = await response.text();

      // Replace absolute source URLs with local proxy endpoints
      bodyText = bodyText.replace(/https:[\\/]+files\.twoplayergames\.org/g, "/api/proxy");
      bodyText = bodyText.replace(/https:[\\/]+images\.twoplayergames\.org/g, "/api/proxy-images");
      bodyText = bodyText.replace(/https:[\\/]+(www\.)?twoplayergames\.org/g, "");

      return new Response(bodyText, {
        status: response.status, // might be 206
        headers: responseHeaders,
      });
    }

    // Return the response body stream for binary files
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`Error in proxy for ${path}:`, error);
    return new Response(`Proxy error: ${error.message}`, { status: 500 });
  }
}
