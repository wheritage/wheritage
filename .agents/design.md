# W Heritage — Design

How W Heritage visuals are built. Colours and type: `.agents/brand.md`. Site engineering and the full
motion house style: `CLAUDE.md` (it wins if anything here disagrees).

## Layout (site design system v2)

- Dark sections by default (noir `#080808`), light sections in ivoire `#F5F4F0` / pierre `#D5D1C8` for rhythm.
- **No rounded corners** anywhere (site, thumbnails, ad frames).
- Vibrant amber gold `#E5AE45` (deep `#8A5C0A` on light sections) for accents, title italics and the primary button. No gradients, no neon glow.
- Thin hairlines instead of boxes and shadows; photos in their natural color (no black & white).
- Serif titles (Cormorant Garamond, light), small uppercase Montserrat eyebrows with wide tracking.
- Calm motion: no splash screen, custom cursor, particle dust or auto-rotating panels (removed in v2).

## Reels and video frames (9:16)

- Frame 1 is a readable claim with the number already visible (e.g. whiteboard "10 000 $/mois").
- A visual change every 2–3 seconds (visual, sound or movement); captions always on screen.
- Lower thirds: name + « Conseiller en sécurité financière · Industrielle Alliance » (EN: Financial Security Advisor · Industrielle Alliance).
- Keep text inside the 9:16 safe area; captions sit above the bottom UI zone.

## Motion (summary of the house rules in `CLAUDE.md`)

- Premium personality: 350–600 ms for UI, 0.9–1.4 s for title reveals, zero overshoot or bounce.
- One signature ease for most moves: `cubic-bezier(.16,1,.3,1)` / GSAP `expo.out`; exits `power2.in`, ~35% shorter.
- Text reveals: lines rising out of a mask, staggered 60–100 ms. No typewriter, no emoji pops, no shakes.
- Ambient layers move at most ~1/3 the speed of the main layer. Respect `prefers-reduced-motion`.

## Thumbnails and ad creatives

- One claim, one number, one face or object. Ivory text on black; the key number may take the amber gold `#E5AE45`.
- Show "illustrative example" wording on any figure that is not the verified RRSP limit
  (see product-marketing §6).
- Leo (auto insurance) is a separate brand: it does not use the W Heritage black/gold system.
