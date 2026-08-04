import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'LAUNCHPAD · Admin Panel',
    short_name: 'LAUNCHPAD',
    description: 'Plataforma administrativa y centro de productividad integral de LAUNCHPAD.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#131314',
    theme_color: '#131314',
    orientation: 'any',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
