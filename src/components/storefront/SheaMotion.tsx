"use client";

import { useEffect } from "react";

const revealSelectors = [
  ".commerce-hero-card",
  ".commerce-service-strip",
  ".commerce-products-section",
  ".commerce-product-card",
  ".commerce-video-section",
  ".commerce-concerns-section",
  ".commerce-seen-strip",
  ".commerce-comparison-section",
  ".commerce-editorial",
  ".commerce-social-proof",
  ".commerce-newsletter",
  ".shea-page-hero",
  ".shea-category-hero",
  ".shea-category-product-grid article",
  ".shea-product-detail-hero",
  ".shea-product-description > div",
  ".shea-product-reviews",
  ".shea-product-related",
  ".shea-blog-feature",
  ".shea-blog-card"
];

export function SheaMotion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const targets = Array.from(document.querySelectorAll<HTMLElement>(revealSelectors.join(",")));
    targets.forEach((target) => target.classList.add("shea-motion-ready"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("shea-motion-in");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.14 }
    );

    targets.forEach((target) => observer.observe(target));

    const heroImages = Array.from(document.querySelectorAll<HTMLElement>(".commerce-hero-card img, .shea-category-hero img, .shea-product-main-image img"));
    function moveImages() {
      const scroll = window.scrollY;
      heroImages.forEach((image) => {
        image.style.transform = `translate3d(0, ${Math.min(scroll * 0.018, 16)}px, 0) scale(1.025)`;
      });
    }

    moveImages();
    window.addEventListener("scroll", moveImages, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", moveImages);
      heroImages.forEach((image) => {
        image.style.transform = "";
      });
    };
  }, []);

  return null;
}
