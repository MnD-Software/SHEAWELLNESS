"use client";
import { useEffect, useState } from "react";
type Enquiry = { id: string; details: { name: string; email: string; type: string; message: string }; created_at: string };
export function EnquiriesView() {
  const [items, setItems] = useState<Enquiry[]>([]);
  const [message, setMessage] = useState('Loading enquiries…');
  useEffect(() => {
    let active = true;
    fetch('/api/admin/enquiries', { cache: 'no-store' })
      .then(async response => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error); if (active) { setItems(payload.data); setMessage(payload.data.length ? '' : 'No enquiries yet.'); } })
      .catch(error => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, []);
  return <section className="shea-admin-enquiries"><h1>Customer enquiries</h1>{message && <p role="status">{message}</p>}
    {items.map(item => <article key={item.id}><span>{item.details.type} · {new Date(item.created_at).toLocaleDateString()}</span><h2>{item.details.name}</h2><a href={`mailto:${item.details.email}`}>{item.details.email}</a><p>{item.details.message}</p></article>)}
  </section>;
}
