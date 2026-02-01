# images/

This folder holds all local image assets for the site. Folders are intentionally empty (placeholders exist) — add images manually when ready.

Structure:

- testimonials/
  - src/           (master/original files; high-res)
  - optimized/     (generated, multiple sizes & formats used by the site)

- projects/
  - <project-id>/
    - src/
    - optimized/

- skills/
  - src/
  - optimized/

- ui/
  - svg/           (small UI icons, prefer SVG)
  - png/           (fallback raster icons if needed)

- profile/
  - src/
  - optimized/

- backgrounds/
  - src/
  - optimized/

Naming conventions (recommended):
- Use kebab-case and descriptive names: `project-analytics-dashboard-hero-1200.webp`
- Include role + size + format: `testimonial-david-chen-160.webp`, `profile-main-400w.jpg`
- Consider fingerprinting in a build step: `hero.abc123.webp` for cache busting in production

Example JSON usage (local paths only):

Basic:
```
{
  "testimonials": [
    {
      "name": "David Chen",
      "role": "CEO, TechStart Inc.",
      "quote": "...",
      "avatar": "/images/testimonials/optimized/david-chen-160.webp",
      "avatarAlt": "David Chen — CEO, TechStart Inc."
    }
  ],
  "projects": [
    {
      "id": "analytics-dashboard",
      "title": "Analytics Dashboard",
      "thumb": "/images/projects/analytics-dashboard/optimized/thumb-300.jpg",
      "hero": "/images/projects/analytics-dashboard/optimized/hero-1200.webp"
    }
  ]
}
```

Notes:
- Do not reference external URLs; use local paths only, as shown above.
- The repo currently contains only placeholder folders and `.gitkeep` files. Add images to the appropriate `src/` or `optimized/` folder when you have them.
- No images are loaded automatically by this change; the folder paths above are examples for when you add assets.

Performance tips:
- Generate optimized variants (webp/avif + jpg/png fallback) and use `srcset` + `sizes` in markup.
- Lazy-load non-critical images (use `loading="lazy"` and/or IntersectionObserver for fine control).
- Preload your most-critical hero/profile image with `<link rel="preload" as="image" href="/images/...">`.

If you want, I can add a small Node.js image-generation script (`scripts/generate-images.js`) using Sharp to create optimized variants automatically. Let me know if you'd like that next.