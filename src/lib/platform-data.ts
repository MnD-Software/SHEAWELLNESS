import type { PlatformSnapshot } from "@/lib/types";

export const platformSnapshot: PlatformSnapshot = {
  stores: [
    {
      id: "store_shea",
      name: "Shea Wellness LTD",
      slug: "shea-wellness",
      status: "active",
      platformDomain: "shea-wellness.myplatform.local",
      customDomain: null,
      currency: "USD",
      plan: "enterprise"
    },
    {
      id: "store_shea_wholesale",
      name: "Shea Wellness Wholesale",
      slug: "shea-wholesale",
      status: "active",
      platformDomain: "shea-wholesale.myplatform.local",
      customDomain: null,
      currency: "USD",
      plan: "scale"
    },
    {
      id: "store_shea_spa",
      name: "Shea Wellness Spa Supply",
      slug: "shea-spa",
      status: "active",
      platformDomain: "shea-spa.myplatform.local",
      customDomain: null,
      currency: "USD",
      plan: "enterprise"
    }
  ],
  activeStore: {
    id: "store_shea",
    name: "Shea Wellness LTD",
    slug: "shea-wellness",
    status: "active",
    platformDomain: "shea-wellness.myplatform.local",
    customDomain: null,
    currency: "USD",
    plan: "enterprise"
  },
  metrics: [
    { label: "Gross sales", value: "$486,920", detail: "+18.4% from wellness retail and spa supply", trend: "up" },
    { label: "Orders", value: "12,248", detail: "218 wholesale and retail orders awaiting fulfillment", trend: "up" },
    { label: "Conversion", value: "5.8%", detail: "+0.7 point lift from product education and checkout", trend: "up" },
    { label: "Mobile sessions", value: "71%", detail: "Strong discovery from organic beauty shoppers", trend: "flat" }
  ],
  products: [
    {
      id: "prod_body_butter",
      storeId: "store_shea",
      title: "Lavender Shea Body Butter Infusion",
      description: "Premium whipped Nailotica shea butter for deep hydration, dry skin repair, and a calm evening ritual.",
      category: "Body Care",
      badge: "Best seller",
      imageUrl: "/assets/shea-body-butter.png",
      imagePosition: "50% 50%",
      compareAtPrice: 30,
      rating: 4.9,
      reviewCount: 286,
      colors: ["Pure Raw", "Lavender", "Lemongrass", "Vanilla-Mint"],
      sizes: ["100g", "250g", "500g"],
      material: "Pure Nailotica shea butter, lavender essential oil, vitamin E",
      deliveryBadge: "Deep hydration",
      price: 24,
      inventoryQty: 148,
      status: "active",
      channel: "both",
      sales: 420
    },
    {
      id: "prod_black_soap",
      storeId: "store_shea",
      title: "African Liquid Black Soap Body & Face Wash",
      description: "A handmade cleansing ritual that gently detoxes, supports acne-prone skin, and helps even skin tone.",
      category: "Face Care",
      badge: "Handmade",
      imageUrl: "/assets/shea-black-soap.png",
      imagePosition: "50% 50%",
      rating: 4.8,
      reviewCount: 174,
      colors: ["Original", "Tea Tree", "Eucalyptus"],
      sizes: ["250ml", "500ml", "Spa refill"],
      material: "Raw African black soap, shea butter, botanical extracts",
      deliveryBadge: "Gentle detox",
      price: 18,
      inventoryQty: 96,
      status: "active",
      channel: "both",
      sales: 335
    },
    {
      id: "prod_chebe_serum",
      storeId: "store_shea",
      title: "Chebe Hair Serum with Karkar Oil",
      description: "A rich hair growth serum designed for length retention, stronger strands, shine, and reduced breakage.",
      category: "Hair Care",
      badge: "Hair growth",
      imageUrl: "/assets/shea-chebe-haircare.png",
      imagePosition: "50% 50%",
      compareAtPrice: 28,
      rating: 4.7,
      reviewCount: 132,
      colors: ["Chebe Serum", "Chebe Butter", "Growth Duo"],
      sizes: ["50ml", "100ml", "Duo kit"],
      material: "Chebe powder, Karkar oil, shea butter, natural oils",
      deliveryBadge: "Length retention",
      price: 22,
      inventoryQty: 64,
      status: "low_stock",
      channel: "both",
      sales: 261
    },
    {
      id: "prod_essential_oils",
      storeId: "store_shea",
      title: "Essential Oils & Aromatherapy Kit",
      description: "Lavender, lemongrass, tea tree, eucalyptus, peppermint, and rosemary oils for relaxation and focus.",
      category: "Essential Oils",
      badge: "Wellness ritual",
      imageUrl: "/assets/shea-essential-oils.png",
      imagePosition: "50% 50%",
      rating: 4.8,
      reviewCount: 118,
      colors: ["Lavender", "Lemongrass", "Tea Tree", "Peppermint"],
      sizes: ["Single oil", "6-oil set", "Humidifier bundle"],
      material: "Pure essential oils and aromatherapy humidifier accessories",
      deliveryBadge: "Sleep and focus",
      price: 32,
      inventoryQty: 73,
      status: "active",
      channel: "online",
      sales: 198
    },
    {
      id: "prod_spa_essentials",
      storeId: "store_shea",
      title: "Professional Spa Essentials Kit",
      description: "Export-ready spa supplies for salons, wellness spas, and distributors, including massage oils and disposables.",
      category: "Spa Essentials",
      badge: "Wholesale ready",
      imageUrl: "/assets/shea-hero.png",
      imagePosition: "50% 50%",
      rating: 4.9,
      reviewCount: 94,
      colors: ["Massage Oil", "Bed Sheets", "Disposable Wear", "Salon Kit"],
      sizes: ["Starter", "Salon", "Distributor"],
      material: "Massage oils, disposable massage bed sheets, disposable pants and bras",
      deliveryBadge: "Export packaging",
      price: 48,
      inventoryQty: 52,
      status: "active",
      channel: "both",
      sales: 176
    }
  ],
  orders: [
    {
      id: "ord_1089",
      storeId: "store_shea",
      orderNumber: "#1089",
      customerName: "Amina Mwangi",
      totalPrice: 132,
      paymentStatus: "paid",
      fulfillmentStatus: "unfulfilled",
      placedAt: "2026-06-24T07:42:00.000Z"
    },
    {
      id: "ord_1088",
      storeId: "store_shea",
      orderNumber: "#1088",
      customerName: "Nia Wellness Spa",
      totalPrice: 384,
      paymentStatus: "paid",
      fulfillmentStatus: "partial",
      placedAt: "2026-06-24T06:19:00.000Z"
    },
    {
      id: "ord_1087",
      storeId: "store_shea",
      orderNumber: "#1087",
      customerName: "Organic Beauty Store",
      totalPrice: 524,
      paymentStatus: "pending",
      fulfillmentStatus: "on_hold",
      placedAt: "2026-06-23T18:06:00.000Z"
    }
  ],
  customers: [
    {
      id: "cust_amina",
      storeId: "store_shea",
      name: "Amina Mwangi",
      email: "amina@example.com",
      lifetimeValue: 2840,
      orders: 18,
      segment: "VIP"
    },
    {
      id: "cust_spa",
      storeId: "store_shea",
      name: "Nia Wellness Spa",
      email: "orders@niawellness.example",
      lifetimeValue: 6120,
      orders: 24,
      segment: "Wholesale"
    },
    {
      id: "cust_beauty",
      storeId: "store_shea",
      name: "Organic Beauty Store",
      email: "buyer@organicbeauty.example",
      lifetimeValue: 4980,
      orders: 15,
      segment: "Distributor"
    }
  ],
  theme: {
    version: 1,
    sections: [
      {
        type: "header",
        settings: {
          brand: "Shea Wellness LTD",
          nav: ["Body Care", "Face Care", "Hair Care", "Wholesale"],
          announcement: "100% natural ingredients. Ethically sourced African shea. Export-ready quality."
        }
      },
      {
        type: "hero",
        settings: {
          headline: "Pure Nailotica Shea. Modern Wellness.",
          body: "Premium handcrafted shea butter skincare and wellness products made from ethically sourced African shea.",
          cta: "Shop Products",
          secondaryCta: "Become a Distributor",
          mediaUrl: "/assets/shea-hero.png",
          imageTone: "evergreen"
        }
      },
      {
        type: "category_rail",
        settings: {
          title: "Shop Shea Wellness rituals",
          categories: [
            { label: "Body Care", detail: "Shea body butter infusions for daily hydration" },
            { label: "Face Care", detail: "African liquid black soap for gentle detox" },
            { label: "Hair Care", detail: "Chebe serum and butter for stronger strands" },
            { label: "Essential Oils", detail: "Aromatherapy oils for sleep, focus, and skincare" },
            { label: "Spa Essentials", detail: "Professional salon and wellness supplies" }
          ]
        }
      },
      {
        type: "featured_collection",
        settings: {
          title: "Premium handcrafted wellness",
          subtitle: "Natural, ethical, and export-ready skincare for shoppers, spas, and distributors.",
          productIds: ["prod_body_butter", "prod_black_soap", "prod_chebe_serum", "prod_essential_oils", "prod_spa_essentials"]
        }
      },
      {
        type: "editorial_split",
        settings: {
          kicker: "Sustainability",
          title: "Ethically sourced from African women cooperatives.",
          body: "Shea Wellness blends clean formulations with African heritage, eco-conscious packaging, and community-first sourcing.",
          points: ["Paraben-free and sulfate-free formulas", "100% organic product positioning", "Private label and wholesale-ready packaging"]
        }
      },
      {
        type: "trust_bar",
        settings: {
          items: ["100% natural ingredients", "Ethically sourced shea butter", "Export-ready quality"]
        }
      },
      {
        type: "footer",
        settings: {
          text: "Shea Wellness LTD - Unga House, 1st Floor, Westlands, Nairobi. sheabutterwellness@gmail.com | +254729621930"
        }
      }
    ]
  }
};
