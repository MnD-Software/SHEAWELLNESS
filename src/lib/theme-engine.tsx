import { formatMoney } from "@/lib/format";
import type { Product, Store, ThemeLayout, ThemeSection } from "@/lib/types";

type StorefrontRendererProps = {
  store: Store;
  products: Product[];
  layout: ThemeLayout;
};

export function StorefrontRenderer({ store, products, layout }: StorefrontRendererProps) {
  return (
    <div className="storefront-frame">
      {layout.sections.map((section, index) => (
        <ThemeSectionRenderer
          key={`${section.type}-${index}`}
          section={section}
          store={store}
          products={products}
        />
      ))}
    </div>
  );
}

function ThemeSectionRenderer({
  section,
  store,
  products
}: {
  section: ThemeSection;
  store: Store;
  products: Product[];
}) {
  if (section.type === "header") {
    return (
      <header className="store-header">
        {section.settings.announcement ? (
          <div className="store-announcement">{section.settings.announcement}</div>
        ) : null}
        <div className="store-nav-row">
          <strong>{section.settings.brand || store.name}</strong>
          <nav>
            {section.settings.nav.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </nav>
          <div className="store-nav-actions">
            <span>Search</span>
            <span>Account</span>
            <span>Cart</span>
          </div>
        </div>
      </header>
    );
  }

  if (section.type === "hero") {
    return (
      <section className={`store-hero tone-${section.settings.imageTone}`}>
        <div className="store-hero-copy">
          <span className="store-kicker">New season retail system</span>
          <h1>{section.settings.headline}</h1>
          <p>{section.settings.body}</p>
          <div className="store-hero-actions">
            <button type="button">{section.settings.cta}</button>
            <button type="button" className="ghost">{section.settings.secondaryCta}</button>
          </div>
          <div className="store-hero-proof">
            <span>4.9/5 buyer rating</span>
            <span>2-day dispatch</span>
            <span>Secure checkout</span>
          </div>
        </div>
        <figure className="store-hero-media">
          <img src={section.settings.mediaUrl} alt="Premium product collection" />
        </figure>
      </section>
    );
  }

  if (section.type === "category_rail") {
    return (
      <section className="category-rail">
        <div className="section-heading compact">
          <h2>{section.settings.title}</h2>
          <p>Curated pathways for faster discovery.</p>
        </div>
        <div className="category-grid">
          {section.settings.categories.map((category, index) => (
            <article key={category.label} className={`category-card category-${index + 1}`}>
              <span>{category.label}</span>
              <strong>{category.detail}</strong>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (section.type === "featured_collection") {
    const featuredProducts = section.settings.productIds
      .map((id) => products.find((product) => product.id === id))
      .filter((product): product is Product => Boolean(product));

    return (
      <section className="store-section">
        <div className="section-heading">
          <h2>{section.settings.title}</h2>
          <p>{section.settings.subtitle}</p>
        </div>
        <div className="store-products">
          {featuredProducts.map((product) => (
            <article key={product.id} className="store-product">
              <div className="product-art">
                <img src={product.imageUrl} alt={product.title} style={{ objectPosition: product.imagePosition }} />
                <span>{product.badge}</span>
              </div>
              <div>
                <small>{product.category}</small>
                <strong>{product.title}</strong>
                <p>{product.description}</p>
                <span>{formatMoney(product.price, store.currency)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (section.type === "editorial_split") {
    return (
      <section className="editorial-split">
        <div className="editorial-visual">
          <img src="/assets/storefront-hero.png" alt="Curated ecommerce merchandising scene" />
        </div>
        <div className="editorial-copy">
          <span className="store-kicker">{section.settings.kicker}</span>
          <h2>{section.settings.title}</h2>
          <p>{section.settings.body}</p>
          <ul>
            {section.settings.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  if (section.type === "trust_bar") {
    return (
      <section className="trust-bar">
        {section.settings.items.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </section>
    );
  }

  return (
    <footer className="store-footer">
      <span>{section.settings.text}</span>
      <span>{store.customDomain ?? store.platformDomain}</span>
    </footer>
  );
}
