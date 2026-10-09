import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";

// Loaded once at module scope; Remotion waits for the fonts before rendering a frame.
loadMontserrat("normal", { weights: ["600", "800", "900"], subsets: ["latin", "latin-ext"] });
loadInter("normal", { weights: ["600", "800"], subsets: ["latin", "latin-ext"] });
