import Image from "next/image";
import { ImageReveal } from "@/components/animations/image-reveal";
import { canOptimizeImage } from "@/lib/utils/media";
import { monogram } from "@/lib/utils/monogram";
import { cn } from "@/lib/utils/cn";

/** Portrait frame (4:5). Without a photo it shows a quiet NG monogram placeholder. */
export function Portrait({
  url,
  name,
  eager = false,
  className,
}: {
  url: string | null;
  name: string;
  eager?: boolean;
  className?: string;
}) {
  return (
    <ImageReveal className={cn("aspect-[4/5] w-full bg-ink-2", className)}>
      {url ? (
        <Image
          data-media
          src={url}
          alt={name ? `Portrait of ${name}` : "Portrait"}
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          loading={eager ? "eager" : "lazy"}
          className="object-cover"
          unoptimized={!canOptimizeImage(url)}
        />
      ) : (
        <div data-media className="flex size-full flex-col items-center justify-center gap-5">
          <span className="font-display text-[clamp(5rem,11vw,9rem)] italic leading-none text-paper/80">
            {monogram(name) || "—"}
          </span>
          <span className="text-xs text-mute">Portrait coming soon</span>
        </div>
      )}
    </ImageReveal>
  );
}
