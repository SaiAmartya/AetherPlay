import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");
  const { searchParams } = new URL(request.url);
  const searchStr = searchParams.toString();
  
  const targetUrl = `https://www.twoplayergames.org/dist/${path}${searchStr ? "?" + searchStr : ""}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return new Response(`Failed to fetch from source dist: ${response.statusText}`, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "";
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", contentType);
    
    // Copy caching and other relevant headers
    const cacheControl = response.headers.get("cache-control");
    if (cacheControl) responseHeaders.set("Cache-Control", cacheControl);

    // If it's a text-based asset, rewrite URLs inside it
    if (
      contentType.includes("text/") ||
      contentType.includes("application/javascript") ||
      contentType.includes("application/x-javascript") ||
      contentType.includes("application/json")
    ) {
      let bodyText = await response.text();

      // Replace CDN and primary domains with local proxies
      bodyText = bodyText.replace(/https:[\\/]+files\.twoplayergames\.org/g, "/api/proxy");
      bodyText = bodyText.replace(/https:[\\/]+images\.twoplayergames\.org/g, "/api/proxy-images");
      
      // Also rewrite relative dist paths inside scripts
      bodyText = bodyText.replace(/url\("\/dist\//g, 'url("/api/proxy-dist/');
      bodyText = bodyText.replace(/src="\/dist\//g, 'src="/api/proxy-dist/');

      return new Response(bodyText, {
        status: 200,
        headers: responseHeaders,
      });
    }

    // Otherwise, stream binary assets (like fonts, images, etc.)
    return new Response(response.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`Error in proxy-dist for ${path}:`, error);
    return new Response(`Proxy error: ${error.message}`, { status: 500 });
  }
}
