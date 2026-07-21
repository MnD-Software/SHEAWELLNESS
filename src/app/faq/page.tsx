import type { Metadata } from "next";
import { SheaPolicyPage } from "@/components/storefront/SheaPolicyPage";
export const metadata: Metadata = { title: "Frequently Asked Questions | Shea Wellness", description: "Answers about natural ingredients, sensitive skin, M-Pesa, delivery, and wholesale.", alternates: { canonical: "/faq" } };
export default function Page() { return <SheaPolicyPage kind="faq" />; }
