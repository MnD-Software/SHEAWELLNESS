"use client";

import { useState } from "react";
import { Check, Copy, Smartphone } from "lucide-react";
import { mpesaTillNumber } from "@/lib/payment-details";
import { useBrandIdentity } from "./BrandIdentity";

export function TillPaymentInstructions({ orderNumber }: { orderNumber?: string }) {
  const brand = useBrandIdentity();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  async function copyTill() {
    try { await navigator.clipboard.writeText(mpesaTillNumber); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); }
  }
  return <section className="checkout-till" aria-label="M-Pesa Till payment instructions">
    <header><Smartphone size={22} /><div><strong>M-Pesa Buy Goods</strong><span>Pay with Lipa na M-Pesa</span></div></header>
    <div className="checkout-till-number"><div><span>Till number</span><strong>{mpesaTillNumber}</strong></div><button type="button" onClick={copyTill} aria-label="Copy Till number">{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? "Copied" : "Copy"}</button></div>
    <p className="checkout-till-note">Pay after our team confirms your delivery fee and final order amount.</p>
    <ol><li>Open M-Pesa and select <strong>Lipa na M-Pesa</strong>.</li><li>Choose <strong>Buy Goods and Services</strong> and enter Till <strong>{mpesaTillNumber}</strong>.</li><li>Enter the confirmed amount, check the business details, then confirm on your phone.</li><li>Share the M-Pesa transaction code with us{orderNumber ? ` and quote ${orderNumber}` : " with your order number"}.</li></ol>
    <p className="checkout-till-status">Payment is confirmed by our team after receipt.</p>
    <span role="status" className={copyError ? "checkout-copy-error" : "sr-only"}>{copyError ? `Please copy the Till number manually: ${mpesaTillNumber}.` : copied ? "Till number copied." : ""}</span>
    {orderNumber && <a className="checkout-receipt-link" href={`https://wa.me/${brand.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${brand.name}, my order number is ${orderNumber}. Please help me confirm the final total and my M-Pesa payment.`)}`} target="_blank" rel="noreferrer">Contact us about this order</a>}
  </section>;
}
