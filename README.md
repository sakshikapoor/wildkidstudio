# WildKid Studio

An AI first studio. We design and build MVPs, internal tools and AI systems.

We're a two person team combining senior product design and engineering. With experience across Stripe, Flipkart and early stage startups, we work directly with founders and product teams to take ideas from concept to production.

## What We Do

### MVPs
From idea to a shipped product in weeks. We handle product strategy, UX, UI and engineering to help you launch faster.

### Internal Tools
Dashboards, admin panels and operational software that simplify complex workflows and improve team productivity.

### AI Systems
AI powered products, workflows and internal tools designed for real world use. From strategy and UX to production ready implementation.

## Services

### Design
- Product strategy
- User research
- UX & UI design
- Design systems
- Interactive prototypes
- Design audits

### Engineering
- Frontend development
- Backend development
- React
- React Native
- TypeScript
- Node.js
- AI integrations
- Production deployment

## How We Work

Every project is led by the two of us from start to finish. No handoffs. No account managers. Just direct collaboration with experienced designers and engineers who build the product together.

## Engagement Models

### Sprint
A focused 1 to 2 week engagement for a feature, workflow or design audit.

### Build
A fixed scope engagement to design and build an MVP from idea to launch.

### Retainer
Ongoing design and engineering support for teams that need continuous product development.

## Selected Work

- Multi supplier B2B marketplace
- Mission control interface for autonomous naval vessels
- AI powered shopping assistant for Flipkart
- BookSkim, our AI native EPUB reader

## Tech

**Design**
- Figma
- FigJam
- Rive
- Spline
- Adobe Creative Suite

**Engineering**
- React
- React Native
- TypeScript
- Node.js
- HTML
- CSS
- Tailwind CSS
- Git

## Contact

🌐 https://wildkidstudio.in/

📧 hello@wildkidstudio.in

---

## Development

This site is built with [Astro](https://astro.build). Static output, no JS
framework runtime shipped to the browser.

### Node version

Use the version in `.nvmrc`. Run `nvm use` in the project root before any
npm command.

> The Homebrew Node on this machine (`~/homebrew/bin/node`) is built from
> source against a broken CA bundle and cannot reach the npm registry —
> installs fail with `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` after a long,
> silent retry backoff. Use the nvm Node instead.

```bash
nvm use          # picks up .nvmrc
npm install
npm run dev      # local dev server with hot reload
npm run build    # static build into dist/
npm run preview  # serve the built output locally
```

### Structure

```
public/
  assets/            favicon, og image, tree.png — served at the site root
  fonts/             self-hosted BBH Bartle (see Fonts below)
src/
  assets/work/       showreel sources — optimised by Astro, see Images
  data/
    projects.ts      the three projects; drives both showreel and pages
  layouts/
    Layout.astro     <head>, meta/OG tags, font links
  components/
    Nav.astro          sticky header
    Tree.astro         the tree artwork, positioned against the page
    Hero.astro         wordmark, intro, "Book Intro Call"
    ServicesBand.astro "ship the next big idea" + services panel
    HowWeEngage.astro  Sprint / Retainer / Build
    Offer.astro        one engagement model
    Showreel.astro     horizontally scrolling work cards
    Principles.astro   the four principle rows
    ContactCta.astro   closing call to action
    PageHeader.astro   eyebrow + title for interior pages
    ArrowIcon.astro    arrow-top-right, inlined
  pages/
    index.astro      → /
    about.astro      → /about
    work/[slug].astro → /work/instasupply, /allenati, /asci
  styles/            SCSS, compiled by Astro; main.scss is the entry point
    _util.scss       u(), the design-pixel helper — see below
```

### Images

Showreel sources live in `src/assets/work/`, **not** `public/`, so Astro
resizes them and emits webp at build time. Two of the originals are ~12MB
PNGs; served raw they would dominate page weight. Through the pipeline the
showreel thumbnails come out around 30kB each.

Adding a project means adding it to `src/data/projects.ts` — the showreel and
its `/work/<slug>` page are both generated from that one list.

### Adding a page

Create a file in `src/pages/` — the filename becomes the route
(`src/pages/about.astro` → `/about`). Wrap the content in `Layout` and pass
`title` and `description`; every page gets the shared header, footer, styles,
and meta tags automatically.

```astro
---
import Layout from '../layouts/Layout.astro';
import Section from '../components/Section.astro';
---

<Layout title="About — WildKid Studio" description="...">
  <main>
    <Section id="story" eyebrow="Our story">
      <h2>…</h2>
    </Section>
  </main>
</Layout>
```

### Fonts

**Anonymous Pro** loads from Google Fonts (linked in `Layout.astro`).

**BBH Bartle is not installed yet.** It is not served by any webfont CDN, so
it has to be self-hosted. Drop the files into `public/fonts/`:

```
public/fonts/BBHBartle-Regular.woff2   (or .woff / .otf / .ttf)
```

`src/styles/_fonts.scss` already declares the `@font-face` and tries each
extension in turn. Until a file is there, headings fall back to Arial Black
and the build logs a "didn't resolve at build time" warning for each missing
extension — both resolve on their own once the font is added. Letterform
widths differ between Bartle and the fallback, so a few headline line breaks
will shift when the real font lands.

### Matching the Figma frame

The design (`wildkid-studio-v2`, node `98:32`) is a fixed 1512px frame with
the tree artwork positioned against it. If type stayed at fixed px while the
artwork scaled with the viewport, the tree would drift into the copy.

So sizes are written through the `u()` helper in `src/styles/_util.scss`,
which expresses a design pixel as a scalable unit: `1px` at or above 1512px
wide, and a proportional fraction below it. The whole frame — type, gutters,
column widths, artwork — scales together, so the layout matches the design at
any width down to the mobile breakpoint, where it restructures into a single
column and sizes are plain px.

### Styles

`src/styles/` is the source of truth. Astro compiles the SCSS during dev and
build — there is no separate `sass` command to run, and no compiled CSS is
committed.
