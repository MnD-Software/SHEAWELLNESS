"use client";
import { useState } from 'react';
import { ArrowRight, Heart, ShoppingBag } from 'lucide-react';
import type { Product } from '@/lib/types';
import { formatMoney, productPriceForSize, productPriceLabel } from '@/lib/format';
import { isSidewaysSheaProductAsset } from '@/lib/shea-media';
import { StorefrontImage } from './StorefrontImage';
import { useStorefrontCart } from './StorefrontCart';

export function ProductCard({product, currency = 'KES', wished = false, onWishlist}: {product: Product; currency?: string; wished?: boolean; onWishlist?: () => void}) {
  const [option, setOption] = useState(product.sizes.length === 1 ? product.sizes[0] : '');
  const cart = useStorefrontCart();
  const selected = product.sizeMedia?.[option];
  const image = selected?.imageUrl ?? product.imageUrl;
  const href = `/products/${encodeURIComponent(product.id)}${option ? `?option=${encodeURIComponent(option)}` : ''}`;
  const available = product.inventoryQty > 0 && ['active','low_stock'].includes(product.status) && product.channel !== 'pos';
  const rotated = isSidewaysSheaProductAsset(image);
  return <article className="commerce-product-card shop-product-card" data-product-id={product.id}>
    <a className={`shop-card-photo${rotated ? ' is-rotated' : ''}`} href={href} aria-label={`View ${product.title}`}><StorefrontImage src={image} alt={`${product.title}${option ? ` — ${option}` : ''}`} loading="lazy" decoding="async" className={rotated ? 'shea-rotated-product-image' : undefined} style={{objectPosition: selected?.imagePosition || product.imagePosition}} />{!image && <span>Photo coming soon</span>}</a>
    {onWishlist && <button className={`shop-card-wishlist${wished ? ' active' : ''}`} type="button" aria-label={`${wished ? 'Remove' : 'Add'} ${product.title} ${wished ? 'from' : 'to'} wishlist`} onClick={onWishlist}><Heart size={17} fill={wished ? 'currentColor' : 'none'} /></button>}
    <div className="shop-card-content"><span className="shop-card-category">{product.category}</span><h3><a href={href}>{product.title}</a></h3><p>{product.description}</p>
      <strong className="shop-card-price" aria-live="polite">{productPriceLabel(product, currency, option)}</strong>
      <div className="shop-card-options">{product.sizes.length <= 3 ? <div role="group" aria-label={`Options for ${product.title}`}>{product.sizes.map(size => <button type="button" key={size} aria-pressed={option === size} onClick={() => setOption(size)}>{size}</button>)}</div> : <select aria-label={`Choose option for ${product.title}`} value={option} onChange={event => setOption(event.target.value)}><option value="" disabled>Choose an option</option>{product.sizes.map(size => <option key={size} value={size}>{size} · {formatMoney(productPriceForSize(product, size), currency)}</option>)}</select>}</div>
      <span className={`shop-card-stock${available ? '' : ' unavailable'}`}>{available ? product.inventoryQty <= 10 ? `Only ${product.inventoryQty} left` : 'In stock' : 'Enquire for availability'}</span>
      <div className="shop-card-actions">{available ? <button type="button" disabled={!option} onClick={() => {cart.add(product, option);cart.open();}}><ShoppingBag size={16} />{option ? 'Add to bag' : 'Choose an option'}</button> : <a className="shop-card-enquire" href={`/contact?product=${encodeURIComponent(product.title)}`}>Enquire <ArrowRight size={15} /></a>}<a href={href} aria-label={`Details for ${product.title}`}>Details <ArrowRight size={15} /></a></div>
    </div>
  </article>;
}
