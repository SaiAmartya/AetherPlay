import { NextResponse } from "next/server";

export const runtime = "edge";

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

    const html = await response.text();

    // Extract window.gameData object from script
    const match = html.match(/window\.gameData\s*=\s*({[\s\S]*?})[\s;<\n]/);
    if (!match) {
      return new Response("Game metadata not found in original frame", { status: 404 });
    }

    let embedUrl = "";
    try {
      const gameData = JSON.parse(match[1]);
      embedUrl = gameData.embed || "";
    } catch (e) {
      console.error("Failed to parse gameData JSON:", e);
      return new Response("Failed to parse game metadata", { status: 500 });
    }

    if (!embedUrl) {
      return new Response("No direct game embed URL found", { status: 404 });
    }

    // Rewrite the embed URL to use our local proxies
    let proxiedEmbedUrl = embedUrl;
    if (proxiedEmbedUrl.includes("files.twoplayergames.org")) {
      proxiedEmbedUrl = proxiedEmbedUrl.replace("https://files.twoplayergames.org", "/api/proxy");
    } else if (proxiedEmbedUrl.includes("images.twoplayergames.org")) {
      proxiedEmbedUrl = proxiedEmbedUrl.replace("https://images.twoplayergames.org", "/api/proxy-images");
    } else if (proxiedEmbedUrl.startsWith("/")) {
      // Relative path fallback
      proxiedEmbedUrl = `/api/proxy${proxiedEmbedUrl}`;
    }

    // Return a clean, ad-free wrapper page that loads the game directly in an iframe
    const wrapperHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>AetherPlay Client</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: #000;
        }
        iframe {
            border: none;
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <iframe 
        src="${proxiedEmbedUrl}" 
        allow="autoplay; gamepad; keyboard; focus-without-user-activation *"
    ></iframe>
</body>
</html>`;

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "text/html; charset=utf-8");
    
    return new Response(wrapperHtml, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`Error in gameframe proxy for ${slug}:`, error);
    return new Response(`Gameframe proxy error: ${error.message}`, { status: 500 });
  }
}
