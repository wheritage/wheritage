// W Héritage tokens (assets/site.css), mapped for video. Premium personality: no overshoot, no bounce.
import { Easing, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";

// Self-hosted (public/fonts, OFL, Google Fonts latin subset, variable weight): renders offline and identically.
loadFont({ family: "Cormorant Garamond", url: staticFile("fonts/CormorantGaramond-latin.woff2"), weight: "300 700" });
loadFont({ family: "Montserrat", url: staticFile("fonts/Montserrat-latin.woff2"), weight: "100 900" });

export const BRAND = {
  noir: "#080808",
  or: "#C9A84C",
  ivory: "#F4EFE3",
  titleFont: "'Cormorant Garamond', serif",
  bodyFont: "Montserrat, sans-serif",
};

// --ease-out: cubic-bezier(.16,1,.3,1) for entrances; exits accelerate (power2.in) and run ~35% shorter.
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.55, 0, 1, 0.45);
