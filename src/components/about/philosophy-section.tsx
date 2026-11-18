import { Reveal } from "@/components/animations/reveal";

/** One quote, set in the serif — the only editorial flourish on the About page. */
export function PhilosophySection({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <section aria-labelledby="philosophy-heading" className="section-y border-t border-line">
      <Reveal className="container-cinema grid gap-8 lg:grid-cols-12">
        <h2 id="philosophy-heading" className="eyebrow lg:col-span-3">
          Philosophy
        </h2>
        <blockquote className="lg:col-span-9">
          <p className="font-display text-[clamp(1.75rem,3.4vw,3rem)] italic leading-[1.2] text-paper/90">
            &ldquo;{text.trim()}&rdquo;
          </p>
        </blockquote>
      </Reveal>
    </section>
  );
}
