import { Reveal } from "@/components/animations/reveal";
import type { WorkflowStep } from "@/types/content";
import { pad2 } from "@/lib/utils/format";

/** Editing & production workflow: the approach in prose, then the steps as a quiet numbered list. */
export function WorkflowSection({ steps, approach }: { steps: WorkflowStep[]; approach: string }) {
  if (steps.length === 0 && !approach.trim()) return null;
  const paragraphs = approach.split(/\n{2,}/).filter(Boolean);

  return (
    <section aria-labelledby="workflow-heading" className="section-y border-t border-line">
      <div className="container-cinema grid gap-14 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow mb-5">Process</p>
          <h2 id="workflow-heading" className="h-section max-w-[14ch]">
            Editing &amp; Production Workflow
          </h2>
          {paragraphs.length > 0 && (
            <div className="lead mt-8 max-w-md space-y-5">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </Reveal>
        {steps.length > 0 && (
          <Reveal className="lg:col-span-6 lg:col-start-7" stagger={0.06}>
            <ol className="border-b border-line">
              {steps.map((s, i) => (
                <li key={s.title + i} data-reveal-item className="grid grid-cols-[3rem_1fr] border-t border-line py-6">
                  <span className="pt-1 text-sm tabular-nums text-mute">{pad2(i + 1)}</span>
                  <div>
                    <h3 className="text-xl font-light tracking-tight">{s.title}</h3>
                    {s.description && <p className="mt-2 leading-relaxed text-mute">{s.description}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        )}
      </div>
    </section>
  );
}
