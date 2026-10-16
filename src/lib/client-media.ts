// Photographs supplied with the October client revisions.
export const clientAsset = (file: string) => `/assets/client-oct-2026/${file}`;
export function prioritizeOwnerFilms<T extends { src: string; title: string }>(films: T[]): T[] {
  const rank = (film: T) => /owner[-_ ]?film[-_ ]?0?1/i.test(`${film.src} ${film.title}`) ? 0
    : /owner[-_ ]?film[-_ ]?0?2/i.test(`${film.src} ${film.title}`) ? 1 : 2;
  return [...films].sort((a, b) => rank(a) - rank(b));
}
