"use client";

import { Heart, PackageCheck, ReceiptText, Star, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SheaGlobalHeader } from "@/components/storefront/SheaGlobalHeader";
import { formatMoney } from "@/lib/format";
import { platformSnapshot } from "@/lib/platform-data";
import { sheaBrand } from "@/lib/shea-content";
import { SheaCommerceFooter, SheaTrustGrid, SheaWhatsApp } from "@/components/storefront/SheaCommerceChrome";

type AccountOrder = {
  source?: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  totalPrice: number;
  createdAt: string;
  paymentStatus: string;
  fulfillmentStatus: string;
};

type AccountReview = {
  source?: string;
  productId: string;
  name: string;
  rating: number;
  body: string;
  createdAt: string;
};

export function SheaAccountDashboard() {
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [reviews, setReviews] = useState<AccountReview[]>([]);

  useEffect(() => {
    const savedOrders = JSON.parse(window.localStorage.getItem("sheaWellnessOrders") ?? "[]") as AccountOrder[];
    const savedReviews = JSON.parse(window.localStorage.getItem("sheaWellnessReviews") ?? "[]") as AccountReview[];
    setOrders(savedOrders.filter((order) => order.source === "shea_storefront_checkout"));
    setReviews(savedReviews.filter((review) => review.source === "shea_storefront_review"));
  }, []);

  const customerName = orders[0]?.customerName || reviews[0]?.name || "Shea Wellness customer";
  const customerEmail = orders[0]?.customerEmail || sheaBrand.email;
  const totalSpent = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  const latestOrder = orders[0];
  const productsById = useMemo(() => new Map(platformSnapshot.products.map((product) => [product.id, product.title])), []);

  return (
    <main className="shea-account-page">
      <SheaGlobalHeader />
      <section className="shea-account-hero">
        <div>
          <span>Customer dashboard</span>
          <h1>{customerName}</h1>
          <p>{customerEmail}</p>
        </div>
        <a href="/shop">Continue shopping</a>
      </section>

      <section className="shea-account-metrics" aria-label="Customer account summary">
        <article>
          <ReceiptText size={20} />
          <span>Orders</span>
          <strong>{orders.length}</strong>
        </article>
        <article>
          <PackageCheck size={20} />
          <span>Total spend</span>
          <strong>{formatMoney(totalSpent, platformSnapshot.activeStore.currency)}</strong>
        </article>
        <article>
          <Star size={20} />
          <span>Reviews</span>
          <strong>{reviews.length}</strong>
        </article>
        <article>
          <Heart size={20} />
          <span>Saved routine</span>
          <strong>Shea care</strong>
        </article>
      </section>

      <section className="shea-account-grid">
        <article className="shea-account-panel">
          <div className="shea-account-panel-head">
            <div>
              <span>Recent orders</span>
              <h2>Purchase history</h2>
            </div>
            <PackageCheck size={22} />
          </div>
          {orders.length ? (
            <div className="shea-account-list">
              {orders.map((order) => (
                <div key={`${order.orderNumber}-${order.createdAt}`}>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <strong>{formatMoney(order.totalPrice, platformSnapshot.activeStore.currency)}</strong>
                    <span>{order.fulfillmentStatus.replace("_", " ")}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="shea-account-empty">
              <UserRound size={30} />
              <strong>No orders yet</strong>
              <p>Your Shea Wellness checkout history will appear here after your first order.</p>
            </div>
          )}
        </article>

        <article className="shea-account-panel">
          <div className="shea-account-panel-head">
            <div>
              <span>Product reviews</span>
              <h2>Your feedback</h2>
            </div>
            <Star size={22} />
          </div>
          {reviews.length ? (
            <div className="shea-account-list reviews">
              {reviews.map((review) => (
                <div key={`${review.productId}-${review.createdAt}`}>
                  <div>
                    <strong>{productsById.get(review.productId) ?? "Shea Wellness product"}</strong>
                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <strong>{review.rating}/5</strong>
                    <span>{review.body}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="shea-account-empty">
              <Star size={30} />
              <strong>No reviews yet</strong>
              <p>Reviews you submit from product quick view will be shown here.</p>
            </div>
          )}
        </article>
      </section>

      <section className="shea-account-care">
        <div>
          <span>Next step</span>
          <h2>{latestOrder ? "Track your Shea Wellness routine" : "Start with a clean Shea Wellness routine"}</h2>
          <p>{latestOrder ? "Your latest order is now visible to the Shea Wellness admin fulfillment queue." : "Browse the full catalogue and build a cart from live storefront products."}</p>
        </div>
        <a href="/shop">Open shop</a>
      </section>
      <SheaTrustGrid /><SheaCommerceFooter /><SheaWhatsApp />
    </main>
  );
}
