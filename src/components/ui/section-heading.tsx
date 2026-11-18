import type { ElementType, ReactNode } from "react";
import { Reveal } from "@/components/animations/reveal";
import { cn } from "@/lib/utils/cn";

/** Small label + one purposeful heading. Used by every section for a consistent rhythm. */
export function SectionHeading({
  id,
  label,
  title,
  as: Tag = "h2",
  aside,
  className,
}: {
  id: string;
  label: string;
  title: ReactNode;
  as?: ElementType;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <Reveal className={cn("flex flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}>
      <div>
        <p className="eyebrow mb-5">{label}</p>
        <Tag id={id} className="h-section max-w-[24ch]">
          {title}
        </Tag>
      </div>
      {aside}
    </Reveal>
  );
}
