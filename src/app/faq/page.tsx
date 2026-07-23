import type { Metadata } from "next";
import { SheaFaqPage } from "@/components/storefront/SheaFaqPage";
export const metadata: Metadata = { title: "Frequently Asked Questions | Shea Wellness", description: "Answers about Shea Wellness products, routines, ingredients, sustainability, M-PESA, delivery, returns, and wholesale.", alternates: { canonical: "/faq" } };
export default function Page() { return <SheaFaqPage />; }
