import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const targetUrl = `https://www.twoplayergames.org/gameframe/${slug}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return new Response(`Failed to fetch gameframe: ${response.statusText}`, { status: response.status });
    }

    let html = await response.text();

    // 1. Rewrite relative paths starting with /dist/ to use our /api/proxy-dist/ proxy
    html = html.replace(/href="\/dist\//g, 'href="/api/proxy-dist/');
    html = html.replace(/src="\/dist\//g, 'src="/api/proxy-dist/');

    // 2. Rewrite twoplayergames.org domains to local proxy endpoints (both plain and escaped JSON format)
    html = html.replace(/https:[\\/]+files\.twoplayergames\.org/g, "/api/proxy");
    html = html.replace(/https:[\\/]+images\.twoplayergames\.org/g, "/api/proxy-images");
    html = html.replace(/https:[\\/]+(www\.)?twoplayergames\.org/g, "");

    // 3. Prevent the iframe breakout scripts or redirection scripts from redirecting to top-level if needed
    // The original page script might do `if (window.self === window.top) { ... }` which is fine inside the iframe.
    // If there is any framebuster script like `window.top.location = window.self.location`, we can neutralize it.
    // In this case, twoplayergames.org uses standard embeds.

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "text/html; charset=utf-8");
    
    return new Response(html, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`Error in gameframe proxy for ${slug}:`, error);
    return new Response(`Gameframe proxy error: ${error.message}`, { status: 500 });
  }
}
