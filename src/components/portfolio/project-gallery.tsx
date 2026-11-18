import Image from "next/image";
import { ImageReveal } from "@/components/animations/image-reveal";
import type { MediaItem } from "@/types/content";
import { canOptimizeImage } from "@/lib/utils/media";

/** A few stills in a calm two-column grid (consistent 16:10 frames, max four). */
export function ProjectGallery({ items, title, exclude }: { items: MediaItem[]; title: string; exclude?: string | null }) {
  // Skip a still that repeats the video poster.
  const stills = items.filter((m) => m.url !== exclude).slice(0, 4);
  if (stills.length === 0) return null;
  return (
    <section aria-labelledby="gallery-heading" className="container-cinema pb-24 lg:pb-32">
      <h2 id="gallery-heading" className="eyebrow mb-8">
        Frames
      </h2>
      <ul className="grid gap-6 sm:grid-cols-2 lg:gap-8">
        {stills.map((m, i) => (
          <li key={`${m.url}-${i}`}>
            <ImageReveal className="aspect-[16/10] w-full bg-ink-2">
              <Image
                data-media
                src={m.url}
                alt={m.caption || `${title} — still ${i + 1}`}
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover"
                unoptimized={!canOptimizeImage(m.url)}
              />
            </ImageReveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
