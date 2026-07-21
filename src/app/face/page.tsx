import { SheaDepartmentPage } from "@/components/storefront/SheaDepartmentPage";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Natural Face Care", description: "Gentle face cleansers, botanical facial oils, shea moisture, and practical routines from Shea Wellness.", alternates: { canonical: "/face" } };
export default function FacePage() { return <SheaDepartmentPage kind="face" />; }
