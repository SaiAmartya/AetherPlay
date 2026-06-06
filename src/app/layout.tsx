import type { Metadata, Viewport } from "next";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "AetherPlay | Unblocked Two Player Games",
  description: "Play your favorite 2 player games unblocked from school or work. High performance, zero lag, and fully proxied mirror of TwoPlayerGames.",
  keywords: "2 player games, unblocked games, school wifi bypass, proxy games, fire and water, basket random, soccer random",
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegister />
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
