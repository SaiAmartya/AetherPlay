import { Metadata } from "next";
import GamePlayer from "@/components/GamePlayer";

interface PlayProps {
  params: Promise<{ slug: string }>;
}

// Helper to format slug to pretty title (e.g. "basket-random" -> "Basket Random")
function getGameTitle(slug: string): string {
  if (!slug) return "";
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// Generate dynamic SEO metadata server-side
export async function generateMetadata({ params }: PlayProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const gameTitle = getGameTitle(slug);

  return {
    title: `Play ${gameTitle} Unblocked | AetherPlay`,
    description: `Play ${gameTitle} unblocked on AetherPlay. Enjoy high-performance, lag-free gameplay with a completely unblocked proxy mirror. Free for school & work networks.`,
    keywords: `${gameTitle} unblocked, play ${gameTitle}, two player games, unblocked games school, aetherplay`,
    openGraph: {
      title: `Play ${gameTitle} Unblocked | AetherPlay`,
      description: `Lag-free school proxy mirror for ${gameTitle}. Play free now on AetherPlay.`,
      type: "video.other",
      url: `/play/${slug}`,
    },
  };
}

export default async function PlayPage({ params }: PlayProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const gameTitle = getGameTitle(slug);

  return <GamePlayer slug={slug} gameTitle={gameTitle} />;
}
