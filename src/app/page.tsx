"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Game {
  slug: string;
  title: string;
  image: string;
  category: string;
}

const CATEGORIES = [
  { id: "", label: "Popular" },
  { id: "action", label: "Action" },
  { id: "racing", label: "Racing" },
  { id: "sport", label: "Sports" },
  { id: "fighting", label: "Fighting" },
  { id: "classic", label: "Classic" },
  { id: "3-4-player", label: "3-4 Players" },
  { id: "1-player", label: "1 Player" },
  { id: "car", label: "Cars" },
  { id: "shooting", label: "Shooting" },
  { id: "zombie", label: "Zombies" }
];

export default function Home() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Game[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Load favorites from LocalStorage on mount
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

  // Fetch games based on active category
  useEffect(() => {
    let active = true;

    if (showFavoritesOnly) {
      setGames(favorites);
      setIsLoading(false);
      return;
    }

    async function fetchGames() {
      setIsLoading(true);
      try {
        const url = activeCategory 
          ? `/api/games?category=${encodeURIComponent(activeCategory)}`
          : "/api/games";
        const res = await fetch(url);
        const data = await res.json();
        if (active) {
          if (data.games) {
            setGames(data.games);
          } else {
            setGames([]);
          }
        }
      } catch (err) {
        console.error("Error fetching games:", err);
        if (active) {
          setGames([]);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchGames();

    return () => {
      active = false;
    };
  }, [activeCategory, showFavoritesOnly, favorites]);

  // Handle Search Submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setActiveCategory("");
      setShowFavoritesOnly(false);
      return;
    }

    setIsLoading(true);
    setShowFavoritesOnly(false);
    setActiveCategory(""); // clear category active state

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.games) {
        setGames(data.games);
      } else {
        setGames([]);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle favorite status of a game
  const toggleFavorite = (e: React.MouseEvent, game: Game) => {
    e.stopPropagation(); // prevent card click navigation
    let updated: Game[];
    const isFav = favorites.some((fav) => fav.slug === game.slug);

    if (isFav) {
      updated = favorites.filter((fav) => fav.slug !== game.slug);
    } else {
      updated = [...favorites, game];
    }

    setFavorites(updated);
    localStorage.setItem("aetherplay_favorites", JSON.stringify(updated));
  };

  const isFavorite = (slug: string) => {
    return favorites.some((fav) => fav.slug === slug);
  };

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="logo-container" onClick={() => {
          setSearchQuery("");
          setActiveCategory("");
          setShowFavoritesOnly(false);
        }}>
          <div className="logo-icon">
            <svg className="logo-icon-svg" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z" />
            </svg>
          </div>
          <span>AetherPlay</span>
        </div>

        <form onSubmit={handleSearch} className="search-bar-container" id="search-form-id">
          <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input
            id="search-input-id"
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </form>

        <div className="header-actions">
          <div 
            className={`favorites-link ${showFavoritesOnly ? "active" : ""}`}
            onClick={() => {
              setShowFavoritesOnly(!showFavoritesOnly);
              setSearchQuery("");
            }}
          >
            <svg className="favorites-icon" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span>My Game Box</span>
          </div>
        </div>
      </header>

      {/* Category Nav */}
      <nav className="category-nav">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            id={`category-btn-${cat.id || "popular"}`}
            onClick={() => {
              setActiveCategory(cat.id);
              setShowFavoritesOnly(false);
              setSearchQuery("");
            }}
            className={`category-btn ${activeCategory === cat.id && !showFavoritesOnly ? "active" : ""}`}
          >
            {cat.label}
          </button>
        ))}
      </nav>

      {/* Main Grid */}
      <main className="main-content">
        <h2 className="section-title">
          {showFavoritesOnly 
            ? "My Game Box" 
            : searchQuery 
              ? `Search Results for "${searchQuery}"` 
              : activeCategory 
                ? CATEGORIES.find(c => c.id === activeCategory)?.label + " Games"
                : "Top 2 Player Games"}
        </h2>

        {isLoading ? (
          <div className="loader-container">
            <div className="spinner"></div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Loading games...</p>
          </div>
        ) : games.length > 0 ? (
          <div className="game-grid">
            {games.map((game) => (
              <div 
                key={game.slug} 
                className="game-card"
                onClick={() => router.push(`/play/${game.slug}`)}
              >
                <div className="game-card-image-wrapper">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={game.image} 
                    alt={game.title} 
                    className="game-card-img" 
                    loading="lazy"
                  />
                </div>
                <div className="game-card-info">
                  <div className="game-card-title" title={game.title}>{game.title}</div>
                  <div className="game-card-footer">
                    <span className="game-card-tag">HTML5</span>
                    <button 
                      className={`favorite-btn ${isFavorite(game.slug) ? "active" : ""}`}
                      onClick={(e) => toggleFavorite(e, game)}
                      aria-label={isFavorite(game.slug) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <svg className="favorite-btn-svg" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-title">No Games Found</div>
            <p className="empty-state-text">
              {showFavoritesOnly 
                ? "Your Game Box is currently empty. Add some games by clicking the heart icon on any game card!"
                : "We couldn't find any games matching your selection. Try checking your internet connection or exploring another category."}
            </p>
          </div>
        )}
      </main>
    </>
  );
}
