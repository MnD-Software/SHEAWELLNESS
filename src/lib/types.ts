export type StoreStatus = "active" | "suspended" | "archived";
export type ProductStatus = "active" | "draft" | "archived" | "low_stock";
export type PaymentStatus = "paid" | "pending" | "authorized" | "refunded" | "failed";
export type FulfillmentStatus = "unfulfilled" | "partial" | "fulfilled" | "on_hold";

export type Store = {
  id: string;
  name: string;
  slug: string;
  status: StoreStatus;
  platformDomain: string;
  customDomain: string | null;
  currency: "USD" | "KES" | "GBP" | "EUR";
  plan: "launch" | "scale" | "enterprise";
};

export type Product = {
  id: string;
  storeId: string;
  title: string;
  description: string;
  category: string;
  badge: string;
  imageUrl: string;
  imagePosition: string;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  colors: string[];
  sizes: string[];
  material: string;
  deliveryBadge: string;
  price: number;
  inventoryQty: number;
  status: ProductStatus;
  channel: "online" | "pos" | "both";
  sales: number;
};

export type Order = {
  id: string;
  storeId: string;
  orderNumber: string;
  customerName: string;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  placedAt: string;
};

export type Customer = {
  id: string;
  storeId: string;
  name: string;
  email: string;
  lifetimeValue: number;
  orders: number;
  segment: string;
};

export type Metric = {
  label: string;
  value: string;
  detail: string;
  trend: "up" | "down" | "flat";
};

export type ThemeSection =
  | {
      type: "header";
      settings: {
        brand: string;
        nav: string[];
        announcement?: string;
      };
    }
  | {
      type: "hero";
      settings: {
        headline: string;
        body: string;
        cta: string;
        secondaryCta: string;
        mediaUrl: string;
        imageTone: "evergreen" | "atelier" | "technical";
      };
    }
  | {
      type: "category_rail";
      settings: {
        title: string;
        categories: Array<{ label: string; detail: string }>;
      };
    }
  | {
      type: "featured_collection";
      settings: {
        title: string;
        subtitle: string;
        productIds: string[];
      };
    }
  | {
      type: "editorial_split";
      settings: {
        kicker: string;
        title: string;
        body: string;
        points: string[];
      };
    }
  | {
      type: "trust_bar";
      settings: {
        items: string[];
      };
    }
  | {
      type: "footer";
      settings: {
        text: string;
      };
    };

export type ThemeLayout = {
  version: 1;
  sections: ThemeSection[];
};

export type PlatformSnapshot = {
  stores: Store[];
  activeStore: Store;
  metrics: Metric[];
  products: Product[];
  orders: Order[];
  customers: Customer[];
  theme: ThemeLayout;
};
