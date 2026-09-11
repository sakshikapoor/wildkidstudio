import type { ImageMetadata } from 'astro';

import instasupply from '../assets/instasupply_cover.png';
import allenati from '../assets/work/allenati.png';
import asci from '../assets/work/asci.png';
import admitspot from '../assets/admitspot_cover.png';
import richapi from '../assets/richapi_cover.png';
import bookskim from '../assets/Bookskim_cover.png';

export interface Project {
  /** URL segment: /work/<slug> */
  slug: string;
  /** Display name, set in the display face. */
  name: string;
  /** Disciplines line under the name in the showreel. */
  disciplines: string;
  /**
   * Cover photograph. Leave it out while a project is still being written
   * up: the grid and the project page show an empty picture box in its place.
   */
  cover?: ImageMetadata;
  /** Alt text for the cover image. */
  coverAlt?: string;
  /** Lead paragraph on the project page. */
  summary: string;
  year?: string;
  role?: string;
  /** The live product, when it is public. */
  liveUrl?: string;
  /** Button label for it. Defaults to "Visit <domain>". */
  liveLabel?: string;
}

// Order is the order of the plates on the homepage.
export const projects: Project[] = [
  // Not yet written up: richapi, bookskim, admitspot. Fill in disciplines,
  // summary, year and role as each one is ready; nothing else needs to change.
  {
    slug: 'richapi',
    name: 'RichAPI',
    disciplines: 'Case study coming soon',
    cover: richapi,
    coverAlt: 'RichAPI homepage on a laptop',
    summary: 'Case study coming soon.',
  },
  {
    slug: 'bookskim',
    name: 'BookSkim',
    disciplines: 'Case study coming soon',
    cover: bookskim,
    coverAlt: 'BookSkim app open on a phone at a desk',
    summary: 'Case study coming soon.',
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
    slug: 'instasupply',
    name: 'InstaSupply',
    disciplines: 'Product Design, Brand Design',
    cover: instasupply,
    coverAlt: 'A contractor holding a hard hat and a phone showing the InstaSupply app',
    summary:
      'A B2B marketplace where buyers order across many suppliers in a single checkout. We designed the product end to end and built the brand system around it.',
    year: '2025',
    role: 'Product Design, Brand Design',
    liveUrl: 'https://instasupply.ca',
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
  {
    slug: 'admitspot',
    name: 'AdmitSpot',
    disciplines: 'Case study coming soon',
    cover: admitspot,
    coverAlt: 'AdmitSpot webinar page on a laptop',
    summary: 'Case study coming soon.',
  },
];
