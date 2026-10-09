import type { Product } from './types';
const order = ['prod_pure_raw','prod_lavender','prod_vanilla_mint','prod_grapefruit','prod_lemongrass','prod_tea_tree_butter','prod_black_soap','prod_chebe_serum','prod_chebe_butter','prod_jamaican_castor','prod_massage_oils','prod_essential_oils','prod_aromatherapy'];
export function arrangeProducts(products: Product[]) {
  return [...products].sort((a,b) => Number(Boolean(b.imageUrl)) - Number(Boolean(a.imageUrl)) || (order.indexOf(a.id) < 0 ? 999 : order.indexOf(a.id)) - (order.indexOf(b.id) < 0 ? 999 : order.indexOf(b.id)) || a.title.localeCompare(b.title));
}
export function suggestedProducts(product: Product, products: Product[]) {
  const complements: Record<string, string[]> = {
    'Skin Care': ['prod_black_soap','prod_jamaican_castor','prod_massage_oils'],
    'Face Care': ['prod_lavender','prod_pure_raw','prod_black_soap'],
    'Hair Care': ['prod_chebe_serum','prod_chebe_butter','prod_jamaican_castor'],
    'Essential Oils': ['prod_aromatherapy'],
    'Aromatherapy': ['prod_essential_oils'],
    'Spa Essentials': ['prod_essential_oils','prod_aromatherapy','prod_massage_oils']
  };
  const candidates = arrangeProducts(products.filter(item => item.id !== product.id && ['active','low_stock'].includes(item.status)));
  const ids = complements[product.category] ?? [];
  return [...candidates.filter(item => ids.includes(item.id)), ...candidates.filter(item => !ids.includes(item.id) && item.category === product.category), ...candidates.filter(item => !ids.includes(item.id) && item.category !== product.category)].slice(0,4);
}
