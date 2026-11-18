import localFont from "next/font/local";
import { GeistSans } from "geist/font/sans";

/**
 * Two families only: Geist Sans for everything, Instrument Serif (SIL OFL)
 * reserved for the NG monogram and the philosophy quote.
 */
export const displaySerif = localFont({
  src: [
    { path: "./instrument-serif-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./instrument-serif-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-display-serif",
  display: "swap",
});

export const fontVariables = `${GeistSans.variable} ${displaySerif.variable}`;
