import { SheaCategoryPage } from "@/components/storefront/SheaCategoryPage";
import { categoryToSlug, slugToCategory } from "@/lib/product-routing";
import { platformSnapshot } from "@/lib/platform-data";

type CategoryParams = Promise<{ categorySlug: string }>;

export function generateStaticParams() {
  const categories = Array.from(new Set(platformSnapshot.products.map((product) => product.category)));

  return categories.map((category) => ({ categorySlug: categoryToSlug(category) }));
}

export default async function CategoryRoute({ params }: { params: CategoryParams }) {
  const { categorySlug } = await params;
  const categories = Array.from(new Set(platformSnapshot.products.map((product) => product.category)));

  return <SheaCategoryPage categorySlug={categorySlug} initialCategory={slugToCategory(categorySlug, categories)} />;
}
