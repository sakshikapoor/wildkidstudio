import type { ImageMetadata } from 'astro';

import instasupply from '../assets/work/instasupply.avif';
import allenati from '../assets/work/allenati.png';
import asci from '../assets/work/asci.png';

export interface Project {
  /** URL segment: /work/<slug> */
  slug: string;
  /** Display name, set in the display face. */
  name: string;
  /** Disciplines line under the name in the showreel. */
  disciplines: string;
  cover: ImageMetadata;
  /** Alt text for the cover image. */
  coverAlt: string;
  /** Lead paragraph on the project page. */
  summary: string;
  year: string;
  role: string;
  /** The live product, when it is public. */
  liveUrl?: string;
  /** Button label for it. Defaults to "Visit <domain>". */
  liveLabel?: string;
}

// Order matches the showreel in Figma (node 105:147).
export const projects: Project[] = [
  {
    slug: 'instasupply',
    name: 'InstaSupply',
    disciplines: 'Product Design, Brand Design',
    cover: instasupply,
    coverAlt: 'InstaSupply product screens',
    summary:
      'A B2B marketplace where buyers order across many suppliers in a single checkout. We designed the product end to end and built the brand system around it.',
    year: '2025',
    role: 'Product Design, Brand Design',
    liveUrl: 'https://instasupply.ca',
  },
  {
    slug: 'allenati',
    name: 'Allenati',
    disciplines: 'Product Design, Brand Design',
    cover: allenati,
    coverAlt: 'Allenati mobile app in use',
    summary:
      'A training product built around how people actually work out. We shaped the product from first principles and gave it an identity that carries across app and marketing.',
    year: '2025',
    role: 'Product Design, Brand Design',
    liveUrl: 'https://apps.apple.com/us/app/allenati/id6751234907',
    liveLabel: 'Download on the App Store',
  },
  {
    slug: 'asci',
    name: 'ASCI',
    disciplines: 'Website Design',
    cover: asci,
    coverAlt: 'ASCI website design',
    summary:
      'A website that had to carry a lot of institutional weight without feeling heavy. Clear structure, considered typography, and a system the team can keep extending.',
    year: '2025',
    role: 'Website Design',
    liveUrl: 'https://asci.co.in',
  },
];
