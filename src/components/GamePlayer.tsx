"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Game {
  slug: string;
  title: string;
  image: string;
  category: string;
}

interface GamePlayerProps {
  slug: string;
  gameTitle: string;
}

export default function GamePlayer({ slug, gameTitle }: GamePlayerProps) {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Game[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Load favorites
  useEffect(() => {
    const saved = localStorage.getItem("aetherplay_favorites");
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }
  }, []);

  const isFavorite = favorites.some((fav) => fav.slug === slug);

  const toggleFavorite = () => {
    let updated: Game[];
    const gameObj: Game = {
      slug,
      title: gameTitle,
      image: `/api/proxy-images/files/games/other/${slug}/${slug}.jpg`, // generic fallback
      category: "favorites",
    };

    if (isFavorite) {
      updated = favorites.filter((fav) => fav.slug !== slug);
    } else {
      updated = [...favorites, gameObj];
    }

    setFavorites(updated);
    localStorage.setItem("aetherplay_favorites", JSON.stringify(updated));
  };

  const handleFullscreen = () => {
    if (viewportRef.current) {
      if (!document.fullscreenElement) {
        viewportRef.current.requestFullscreen().catch((err) => {
          console.error(`Error enabling full-screen mode: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="logo-container" onClick={() => router.push("/")} id="play-header-logo-id">
          <div className="logo-icon">
            <svg className="logo-icon-svg" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z" />
            </svg>
          </div>
          <span>AetherPlay</span>
        </div>
        <div className="header-actions">
          <div className="favorites-link" onClick={() => router.push("/")} id="play-header-back-id">
            <span>Back to Dashboard</span>
          </div>
        </div>
      </header>

      {/* Main Play Area */}
      <div className="play-layout">
        <div className="game-viewport-container">
          <div className="game-header-area">
            <button className="back-btn" onClick={() => router.push("/")} id="play-back-btn-id">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Dashboard</span>
            </button>
            <h1 style={{ fontSize: "1.25rem", fontWeight: "700" }}>{gameTitle}</h1>
          </div>

          <div className="game-viewport" ref={viewportRef} id="game-viewport-id">
            <iframe 
              src={`/api/gameframe/${slug}`}
              className="game-iframe"
              title={gameTitle}
              allowFullScreen
              tabIndex={0}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar-controls">
          <h2 className="sidebar-game-title">{gameTitle}</h2>
          
          <div className="sidebar-game-meta">
            <div className="meta-row">
              <span className="meta-label">Platform</span>
              <span className="meta-value">HTML5 / WebGL</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Connection</span>
              <span className="meta-value" style={{ color: "var(--accent-emerald-light)" }}>100% Proxied</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Source</span>
              <span className="meta-value" style={{ fontSize: "0.8rem" }}>TwoPlayerGames</span>
            </div>
          </div>

          <div className="action-buttons">
            <button className="action-btn btn-primary" onClick={handleFullscreen} id="fullscreen-btn-id">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
              Fullscreen
            </button>
            
            <button 
              className={`action-btn btn-secondary ${isFavorite ? "active" : ""}`}
              onClick={toggleFavorite}
              id="favorite-btn-id"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? "var(--accent-rose)" : "none"} stroke={isFavorite ? "var(--accent-rose)" : "currentColor"} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {isFavorite ? "In Your Game Box" : "Add to Game Box"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
