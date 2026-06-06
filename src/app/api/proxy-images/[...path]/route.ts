import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");
  const { searchParams } = new URL(request.url);
  const searchStr = searchParams.toString();
  
  const targetUrl = `https://images.twoplayergames.org/${path}${searchStr ? "?" + searchStr : ""}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return new Response(`Failed to fetch image from source: ${response.statusText}`, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", contentType);

    const cacheControl = response.headers.get("cache-control");
    if (cacheControl) responseHeaders.set("Cache-Control", cacheControl);

    return new Response(response.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`Error in proxy-images for ${path}:`, error);
    return new Response(`Proxy error: ${error.message}`, { status: 500 });
  }
}
