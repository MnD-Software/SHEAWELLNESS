import { platformSnapshot } from "@/lib/platform-data";
import type { Product } from "@/lib/types";

type ProductCreateInput = Omit<
  Product,
  | "id"
  | "storeId"
  | "sales"
  | "channel"
  | "category"
  | "badge"
  | "imageUrl"
  | "imagePosition"
  | "rating"
  | "reviewCount"
  | "colors"
  | "sizes"
  | "material"
  | "deliveryBadge"
> &
  Partial<
    Pick<
      Product,
      "category" | "badge" | "imageUrl" | "imagePosition" | "rating" | "reviewCount" | "colors" | "sizes" | "material" | "deliveryBadge"
    >
  >;

export interface CatalogRepository {
  listProducts(storeId: string): Promise<Product[]>;
  createProduct(storeId: string, product: ProductCreateInput): Promise<Product>;
}

export class SeedCatalogRepository implements CatalogRepository {
  async listProducts(storeId: string) {
    return platformSnapshot.products.filter((product) => product.storeId === storeId);
  }

  async createProduct(storeId: string, product: ProductCreateInput) {
    const created: Product = {
      id: `prod_${crypto.randomUUID()}`,
      storeId,
      sales: 0,
      channel: "online",
      ...product,
      category: product.category ?? "New arrival",
      badge: product.badge ?? "Draft",
      imageUrl: product.imageUrl ?? "/assets/storefront-hero.png",
      imagePosition: product.imagePosition ?? "50% 50%",
      rating: product.rating ?? 0,
      reviewCount: product.reviewCount ?? 0,
      colors: product.colors ?? ["Default"],
      sizes: product.sizes ?? ["One size"],
      material: product.material ?? "Merchant supplied product details",
      deliveryBadge: product.deliveryBadge ?? "Ready to ship"
    };

    return created;
  }
}

export const catalogRepository = new SeedCatalogRepository();
