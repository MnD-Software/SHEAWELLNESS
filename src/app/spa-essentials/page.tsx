import { SheaDepartmentPage } from "@/components/storefront/SheaDepartmentPage";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Spa Essentials and Aromatherapy", description: "Essential oils, diffusers, humidifiers, massage care, and professional spa supplies.", alternates: { canonical: "/spa-essentials" } };
export default function SpaEssentialsPage() { return <SheaDepartmentPage kind="spa" />; }
