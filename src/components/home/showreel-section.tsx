import { ImageReveal } from "@/components/animations/image-reveal";
import { VideoPlayer } from "@/components/common/video-player";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Showreel } from "@/types/content";

/** One large video, one heading, one line of copy. */
export function ShowreelSection({ showreel }: { showreel: Showreel }) {
  return (
    <section id="showreel" aria-labelledby="showreel-heading" className="section-y scroll-mt-16 border-t border-line">
      <div className="container-cinema">
        <SectionHeading
          id="showreel-heading"
          label="Showreel"
          title="Selected Moments. One Vision."
          className="mb-12 md:mb-16"
          aside={showreel.subtitle ? <p className="lead max-w-sm md:text-right">{showreel.subtitle}</p> : undefined}
        />
        <ImageReveal className="aspect-video w-full bg-ink-2">
          <div data-media className="size-full">
            <VideoPlayer
              source={showreel.video_source}
              url={showreel.video_url}
              poster={showreel.thumbnail_url}
              title={showreel.title || "Showreel"}
              className="size-full"
            />
          </div>
        </ImageReveal>
      </div>
    </section>
  );
}
