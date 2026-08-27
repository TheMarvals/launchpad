export interface SliderItem {
  id: string | number;
  title: string;
  image: string;
  alt?: string;
  href?: string;
  meta?: string;
}

export const sliderDemoProjects: SliderItem[] = [
  {
    id: 'nathan-riley',
    title: 'Nathan Riley',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
    alt: 'Nathan Riley — Art direction & surrealist 3D visuals',
    meta: '3D & Motion • 2026',
    href: '#nathan-riley',
  },
  {
    id: 'casa-di-solare',
    title: 'Casa Di Solare',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
    alt: 'Casa Di Solare — Font catalogue & architecture',
    meta: 'Typography • 2026',
    href: '#casa-di-solare',
  },
  {
    id: 'the-lookback',
    title: 'The Lookback',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80',
    alt: 'The Lookback — Digital capsule and studio retrospective',
    meta: 'Creative Direction • 2026',
    href: '#the-lookback',
  },
  {
    id: 'book-of-happiness',
    title: 'Book of Happiness',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1600&q=80',
    alt: 'Book of Happiness — Editorial & leadership interactive experience',
    meta: 'Interactive Story • 2026',
    href: '#book-of-happiness',
  },
  {
    id: 'dogelon-mars',
    title: 'Dogelon Mars',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
    alt: 'Dogelon Mars — Intergalactic exploration & storytelling',
    meta: 'Experience • 2026',
    href: '#dogelon-mars',
  },
  {
    id: 'gil-huybrecht',
    title: 'Gil Huybrecht',
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
    alt: 'Gil Huybrecht — Typography-heavy web design and art direction',
    meta: 'Art Direction • 2026',
    href: '#gil-huybrecht',
  },
  {
    id: 'discoveryland',
    title: 'Discoveryland',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    alt: 'Discoveryland — International portfolio experience',
    meta: 'Architecture • 2026',
    href: '#discoveryland',
  },
  {
    id: 'griflan',
    title: 'Griflan',
    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1600&q=80',
    alt: 'Griflan — Culture-moving creative studio showcase',
    meta: 'Design & Strategy • 2026',
    href: '#griflan',
  },
];
