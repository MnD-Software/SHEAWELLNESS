"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Droplets, Flower2, Leaf, Sparkles, Sun, X } from "lucide-react";

const choices = [
  { id: "dry-flaky-skin", title: "Dry or flaky skin", detail: "A cleansing and moisture routine.", Icon: Droplets },
  { id: "sensitive-skin", title: "Sensitive skin", detail: "Gentle care and patch-test guidance.", Icon: Flower2 },
  { id: "face-care", title: "Everyday face care", detail: "A simple morning and evening routine.", Icon: Sun },
  { id: "body-glow", title: "Softer, glowing skin", detail: "Refresh, moisturise and seal hydration.", Icon: Sparkles },
  { id: "hair-scalp", title: "Hair and scalp care", detail: "Cleansing, conditioning and moisture.", Icon: Leaf },
  { id: "spa-essentials", title: "A calmer space", detail: "Aromatherapy and spa essentials.", Icon: Flower2 }
];

export function RoutineFinderLink() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const controls = dialog.current?.querySelectorAll<HTMLElement>("button,a[href]");
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, [open]);
  return <><a href="/wellness-guides" aria-haspopup="dialog" onClick={event => { event.preventDefault(); setOpen(true); }}>Find your routine <ArrowRight size={18} /></a>
    {open && createPortal(<div className="routine-finder-backdrop" data-cms-exclude onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section ref={dialog} className="routine-finder-dialog" role="dialog" aria-modal="true" aria-labelledby="routine-finder-title" aria-describedby="routine-finder-description">
        <button type="button" className="routine-finder-close" aria-label="Close routine finder" onClick={() => setOpen(false)}><X size={22} /></button>
        <span className="routine-finder-eyebrow">Your everyday ritual</span>
        <h2 id="routine-finder-title">What would you like to care for?</h2>
        <p id="routine-finder-description">Choose a starting point. We’ll take you to the matching routine and product guide.</p>
        <div className="routine-finder-choices">{choices.map(({ id, title, detail, Icon }) => <a href={`/wellness-guides#${id}`} key={id}><Icon size={24} /><span><strong>{title}</strong><small>{detail}</small></span><ArrowRight size={18} /></a>)}</div>
        <a className="routine-finder-browse" href="/wellness-guides">Explore all routines <ArrowRight size={16} /></a>
      </section>
    </div>, document.body)}
  </>;
}
