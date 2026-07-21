"use client";

import { CheckCircle2, CreditCard, HeartHandshake, Leaf, LockKeyhole, MessageCircle, PackageCheck, Rabbit, Recycle, Truck } from "lucide-react";
import { FormEvent, useState } from "react";

export function SheaTrustGrid() {
  const items = [
    [LockKeyhole, "Secure checkout"],
    [HeartHandshake, "Money-back guarantee"],
    [Leaf, "Natural ingredients"],
    [Rabbit, "Cruelty free"],
    [Recycle, "Eco friendly"],
    [Truck, "Fast delivery"],
    [CreditCard, "M-Pesa accepted"]
  ] as const;
  return <section className="shea-commerce-trust" aria-label="Shopping assurances">{items.map(([Icon, label]) => <span key={label}><Icon size={19} /><strong>{label}</strong></span>)}</section>;
}

export function SheaCommerceFooter() {
  const [joined, setJoined] = useState(false);
  function subscribe(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setJoined(true); }
  return (
    <footer className="shea-commerce-footer">
      <div className="shea-commerce-footer-newsletter">
        <div><span>Stay naturally informed</span><h2>New rituals, offers, and wellness guidance.</h2></div>
        <form onSubmit={subscribe}><label className="sr-only" htmlFor="footer-email">Email address</label><input id="footer-email" required type="email" placeholder="Email address" /><button type="submit">{joined ? "Thank you" : "Subscribe"}</button></form>
      </div>
      <div className="shea-commerce-footer-grid">
        <div className="shea-commerce-footer-brand"><img src="/assets/shea-wellness-tree-logo.jpeg" alt="Shea Wellness" /><p>Natural skin, face, hair, and spa care rooted in African botanical heritage.</p><span><PackageCheck size={16} /> Made in Kenya</span></div>
        <nav aria-label="Company links"><strong>Company</strong><a href="/about">About</a><a href="/contact">Contact</a><a href="/sustainability">Sustainability</a><a href="/wholesale">Wholesale</a></nav>
        <nav aria-label="Customer care links"><strong>Customer care</strong><a href="/policies">Policies</a><a href="/refund-policy">Refund policy</a><a href="/shipping-policy">Shipping</a><a href="/faq">FAQ</a></nav>
        <nav aria-label="Social media links"><strong>Follow us</strong><a href="https://www.instagram.com/sheawellnesske/" target="_blank" rel="noreferrer">Instagram</a><a href="https://wa.me/254729621930" target="_blank" rel="noreferrer">WhatsApp</a><a href="mailto:sheabutterwellness@gmail.com">Email</a></nav>
        <div className="shea-footer-payments"><strong>Payment methods</strong><div><span>M-Pesa</span><span>Visa</span><span>Mastercard</span><span>PayPal</span></div><small><LockKeyhole size={14} /> Secure checkout</small></div>
      </div>
      <div className="shea-commerce-footer-bottom"><span>© {new Date().getFullYear()} Shea Wellness Ltd.</span><span><CheckCircle2 size={15} /> Natural care. Intentional wellness.</span></div>
    </footer>
  );
}

export function SheaWhatsApp() {
  return <a className="shea-whatsapp-chat" href="https://wa.me/254729621930?text=Hello%20Shea%20Wellness%2C%20I%20need%20help%20choosing%20a%20product." target="_blank" rel="noreferrer" aria-label="Chat with Shea Wellness on WhatsApp"><MessageCircle size={22} /><span>Chat with us</span></a>;
}
