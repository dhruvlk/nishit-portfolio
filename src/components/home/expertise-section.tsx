import { Reveal } from "@/components/animations/reveal";
import type { ExpertiseItem } from "@/types/content";
import { cn } from "@/lib/utils/cn";

/**
 * Typography-only skills list in two columns. The home page shows a short list of
 * titles; the About page passes `detailed` to add each one-line description.
 */
export function ExpertiseSection({
  items,
  limit,
  detailed = false,
  bordered = true,
}: {
  items: ExpertiseItem[];
  limit?: number;
  detailed?: boolean;
  bordered?: boolean;
}) {
  const list = limit ? items.slice(0, limit) : items;
  if (list.length === 0) return null;

  return (
    <section aria-labelledby="expertise-heading" className={cn("section-y", bordered && "border-t border-line")}>
      <div className="container-cinema grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="eyebrow mb-5">Expertise</p>
          <h2 id="expertise-heading" className="h-section max-w-[14ch]">
            The craft, end to end.
          </h2>
        </Reveal>
        <Reveal className="lg:col-span-8" stagger={0.04}>
          <ul className="grid gap-x-12 sm:grid-cols-2">
            {list.map((item) => (
              <li key={item.title} data-reveal-item className="border-t border-line py-5">
                <p className="text-lg font-light tracking-tight md:text-xl">{item.title}</p>
                {detailed && item.description && <p className="mt-2 text-sm leading-relaxed text-mute">{item.description}</p>}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
