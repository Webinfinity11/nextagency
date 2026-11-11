// Shape shared by every locale; later this can be loaded from Prisma instead of static files.
type Lines = [string, string];
export type HeroContent = {
  title: string;
  description: string;
  navLabel: string;
  nav: string[];
  home: string;
  skip: string;
  /** aria-label of the language switcher link, in this locale's language. */
  langLabel: string;
  /** Visible short name of the other locale, e.g. "EN" or "ქარ". */
  langShort: string;
  /** Two phrases, each with a left and right group of two lines. */
  phrases: [[Lines, Lines], [Lines, Lines]];
  stats: string[];
  statNote: string;
  mediaLabel: string;
  mediaIndex: string;
  support: string;
  closing: Lines;
  contact: string;
  contactNote: string;
};
