import { ArrowUpRight } from "lucide-react";
import { SOCIAL_PLATFORMS } from "@/config/site";
import type { SocialLink } from "@/types/content";
import { cn } from "@/lib/utils/cn";

const LABELS = Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.id, p.label]));

export function SocialLinks({
  links,
  className,
  itemClassName,
}: {
  links: SocialLink[];
  className?: string;
  itemClassName?: string;
}) {
  if (links.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-x-6 gap-y-2", className)}>
      {links.map((l) => (
        <li key={l.id}>
          <a
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("group -my-2.5 inline-flex items-center gap-1 py-2.5 link-underline", itemClassName)}
          >
            {LABELS[l.platform] ?? l.platform}
            <ArrowUpRight
              aria-hidden
              className="size-3.5 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
