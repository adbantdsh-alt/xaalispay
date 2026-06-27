import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  // Tunnel ngrok temporaire pour tester Bictorys en local (URL éphémère —
  // à mettre à jour si le tunnel est relancé). Sans ça, le serveur de dev
  // Next.js bloque silencieusement les requêtes cross-origin (RSC/Server
  // Actions), ce qui rend les boutons inertes sans erreur claire en console.
  allowedDevOrigins: ["jacket-dander-human.ngrok-free.dev"],
};

export default nextConfig;
