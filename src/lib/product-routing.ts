export function categoryToSlug(category: string) {
  return category
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugToCategory(slug: string, categories: string[]) {
  return categories.find((category) => categoryToSlug(category) === slug) ?? null;
}
