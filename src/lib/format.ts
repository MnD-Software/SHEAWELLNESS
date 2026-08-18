export function formatMoney(value: number, currency = "USD") {
  if (value <= 0) return "Price pending";
  if (currency === "KES") {
    return `KSh ${new Intl.NumberFormat("en-KE", {
      maximumFractionDigits: value % 1 === 0 ? 0 : 2
    }).format(value)}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2
  }).format(value);
}

export function productPriceForSize(product: { price: number; sizePrices?: Record<string, number> }, size?: string) {
  return size && product.sizePrices?.[size] !== undefined ? product.sizePrices[size] : product.price;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
