import { ArrowRight, MessageCircle, Search } from "lucide-react";
import { faqGroups } from "@/lib/shea-website-content";
import { SheaCommerceFooter, SheaTrustGrid, SheaWhatsApp } from "@/components/storefront/SheaCommerceChrome";
import { SheaGlobalHeader } from "@/components/storefront/SheaGlobalHeader";

export function SheaFaqPage() {
  return (
    <main className="shea-faq-page">
      <SheaGlobalHeader />
      <section className="shea-faq-hero">
        <span>Frequently asked questions</span>
        <h1>Answers for your routine, order and delivery.</h1>
        <p>Explore practical Shea Wellness guidance, from choosing botanical oils to wholesale and international shipping.</p>
        <label><Search size={19} /><span>Browse the categories below or use your browser search to find a question.</span></label>
      </section>

      <nav className="shea-faq-nav" aria-label="FAQ categories">
        {faqGroups.map((group, index) => <a href={`#faq-${index + 1}`} key={group.title}>{group.title}</a>)}
      </nav>

      <section className="shea-faq-groups">
        {faqGroups.map((group, groupIndex) => (
          <article id={`faq-${groupIndex + 1}`} key={group.title}>
            <header><span>{String(groupIndex + 1).padStart(2, "0")}</span><h2>{group.title}</h2></header>
            <div>
              {group.items.map(([question, answer]) => (
                <details key={question}>
                  <summary>{question}<i>+</i></summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="shea-faq-advisor">
        <MessageCircle size={28} />
        <div><span>Need personal guidance?</span><h2>Build a routine with a Shea Wellness advisor.</h2><p>Tell us about your skin or hair concern and we’ll help you choose a simple product pairing.</p></div>
        <a href="/contact">Contact our team <ArrowRight size={17} /></a>
      </section>
      <SheaTrustGrid /><SheaCommerceFooter /><SheaWhatsApp />
    </main>
  );
}
