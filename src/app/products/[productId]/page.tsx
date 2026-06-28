import { SheaProductDetail } from "@/components/storefront/SheaProductDetail";
import { platformSnapshot } from "@/lib/platform-data";

type ProductParams = Promise<{ productId: string }>;

export default async function ProductDetailRoute({ params }: { params: ProductParams }) {
  const { productId } = await params;
  const decodedProductId = decodeURIComponent(productId);
  const initialProduct = platformSnapshot.products.find((product) => product.id === decodedProductId) ?? null;

  return <SheaProductDetail productId={decodedProductId} initialProduct={initialProduct} />;
}
