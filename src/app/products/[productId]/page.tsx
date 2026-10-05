import { SheaProductDetail } from "@/components/storefront/SheaProductDetail";
import { getStoreContent } from "@/server/repositories/storeContentRepository";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
import type { Metadata } from "next";

type ProductParams = Promise<{ productId: string }>;

export async function generateMetadata({ params }: { params: ProductParams }): Promise<Metadata> {
  const { productId } = await params;
  const content = await getStoreContent();
  const product = content.products.find((item) => item.id === decodeURIComponent(productId) && (item.status === "active" || item.status === "low_stock"));
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
  const content = await getStoreContent();
  const initialProduct = content.products.find((product) => product.id === decodedProductId && (product.status === "active" || product.status === "low_stock"));
  if (!initialProduct) notFound();

  return <SheaProductDetail productId={decodedProductId} initialProduct={initialProduct} />;
}
