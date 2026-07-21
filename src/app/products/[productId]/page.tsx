import { SheaProductDetail } from "@/components/storefront/SheaProductDetail";
import { platformSnapshot } from "@/lib/platform-data";
import type { Metadata } from "next";

type ProductParams = Promise<{ productId: string }>;

export async function generateMetadata({ params }: { params: ProductParams }): Promise<Metadata> {
  const { productId } = await params;
  const product = platformSnapshot.products.find((item) => item.id === decodeURIComponent(productId));
  if (!product) return { title: "Product not found | Shea Wellness" };
  const path = `/products/${encodeURIComponent(product.id)}`;
  return {
    title: `${product.title} | Shea Wellness`,
    description: product.description,
    alternates: { canonical: path },
    openGraph: { title: product.title, description: product.description, type: "website", url: path, images: [{ url: product.imageUrl, alt: product.title }] },
    twitter: { card: "summary_large_image", title: product.title, description: product.description, images: [product.imageUrl] }
  };
}

export default async function ProductDetailRoute({ params }: { params: ProductParams }) {
  const { productId } = await params;
  const decodedProductId = decodeURIComponent(productId);
  const initialProduct = platformSnapshot.products.find((product) => product.id === decodedProductId) ?? null;

  return <SheaProductDetail productId={decodedProductId} initialProduct={initialProduct} />;
}
