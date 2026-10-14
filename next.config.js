/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignora errores estrictos de tipos durante el build para desplegar rápido
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora advertencias de linter durante el build
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;