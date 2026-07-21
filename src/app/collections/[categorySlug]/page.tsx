import { SheaCategoryPage } from "@/components/storefront/SheaCategoryPage";
import { categoryToSlug, slugToCategory } from "@/lib/product-routing";
import { platformSnapshot } from "@/lib/platform-data";
import { redirect } from "next/navigation";

type CategoryParams = Promise<{ categorySlug: string }>;

export function generateStaticParams() {
  const categories = Array.from(new Set(platformSnapshot.products.map((product) => product.category)));

  return categories.map((category) => ({ categorySlug: categoryToSlug(category) }));
}

export default async function CategoryRoute({ params }: { params: CategoryParams }) {
  const { categorySlug } = await params;
  const departmentRoutes = {
    "face-care": "/face",
    "body-care": "/skin",
    "hair-care": "/hair",
    "gift-sets": "/wellness-gifts",
    "spa-essentials": "/spa-essentials",
    "aromatherapy": "/spa-essentials",
    "essential-oils": "/spa-essentials"
  } as const;
  const departmentRoute = departmentRoutes[categorySlug as keyof typeof departmentRoutes];
  if (departmentRoute) redirect(departmentRoute);
  const categories = Array.from(new Set(platformSnapshot.products.map((product) => product.category)));

  return <SheaCategoryPage categorySlug={categorySlug} initialCategory={slugToCategory(categorySlug, categories)} />;
}
