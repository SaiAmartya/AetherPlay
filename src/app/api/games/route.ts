import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "";

  // Standardize category name or fallback to home page
  const targetUrl = category 
    ? `https://www.twoplayergames.org/${encodeURIComponent(category)}`
    : `https://www.twoplayergames.org/`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch from source: ${response.statusText}` }, { status: response.status });
    }

    const html = await response.text();

    // Find all <a href="/game/slug" ...> tags that represent games
    // We match broad pattern and extract attributes inside each match to be robust to attribute ordering
    const aTags = html.match(/<a[^>]+href="\/game\/[^>]+>/g) || [];
    
    const gamesMap = new Map();

    for (const tag of aTags) {
      const slugMatch = tag.match(/href="\/game\/([^"]+)"/);
      const titleMatch = tag.match(/title="([^"]+)"/);
      const imgMatch = tag.match(/data-game-image="([^"]+)"/);

      if (slugMatch && titleMatch && imgMatch) {
        const slug = slugMatch[1];
        const title = titleMatch[1];
        const image = imgMatch[1];

        // Deduplicate games by slug
        if (!gamesMap.has(slug)) {
          gamesMap.set(slug, {
            slug,
            title,
            image: `/api/proxy-images/files/games/${image}`, // Proxy image through local route
            category: category || "popular",
          });
        }
      }
    }

    const games = Array.from(gamesMap.values());

    return NextResponse.json({ games });
  } catch (error: any) {
    console.error("Error scraping games:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch games" }, { status: 500 });
  }
}
