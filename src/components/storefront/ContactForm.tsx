"use client";
import { useState, type FormEvent } from "react";
export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true); setMessage("");
    try {
      const response = await fetch('/api/storefront/enquiries', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setMessage('Your enquiry has been received. Shea Wellness will contact you by email.'); form.reset();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Please try again or email Shea Wellness.'); }
    finally { setBusy(false); }
  }
  return <form className="shea-contact-form" onSubmit={submit}>
    <span>Contact form</span><h2>Business enquiries welcome</h2>
    <label>Name<input name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder="Your name" /></label>
    <label>Email<input name="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" type="email" /></label>
    <label>Enquiry type<select name="type" defaultValue="Wholesale"><option>Wholesale</option><option>Retail order</option><option>Spa essentials</option><option>Media</option></select></label>
    <label>Message<textarea name="message" required minLength={10} maxLength={4000} placeholder="Tell Shea Wellness what you need" /></label>
    <button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send enquiry'}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
