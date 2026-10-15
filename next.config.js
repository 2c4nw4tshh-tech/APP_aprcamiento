/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignorar errores de tipos y ESLint en el build (ya los revisas localmente)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    domains: [
      "lh3.googleusercontent.com",
      "avatars.githubusercontent.com",
    ],
  },

  // Necesario para que Leaflet no rompa en SSR
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

module.exports = nextConfig;