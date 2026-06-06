import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  if (!query) {
    return NextResponse.json({ games: [] });
  }

  const targetUrl = `https://www.twoplayergames.org/search.json?q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Search request failed: ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    const rows = data.rows || [];

    // Format the search results to match our frontend interface format
    const games = rows.map((row: any) => {
      // Extract the slug from the url (e.g. "/game/basket-random" -> "basket-random")
      const slug = row.url ? row.url.replace("/game/", "") : "";
      
      // Rewrite the image CDN URL to use our proxy
      let image = row.image || "";
      if (image.includes("images.twoplayergames.org/")) {
        image = image.replace("https://images.twoplayergames.org/", "/api/proxy-images/");
      } else if (image.includes("files.twoplayergames.org/")) {
        image = image.replace("https://files.twoplayergames.org/", "/api/proxy/");
      }

      return {
        slug,
        title: row.title,
        image,
        category: "search",
      };
    }).filter((g: any) => g.slug); // Only keep games with a valid slug

    return NextResponse.json({ games });
  } catch (error: any) {
    console.error("Error searching games:", error);
    return NextResponse.json({ error: error.message || "Search failed" }, { status: 500 });
  }
}
