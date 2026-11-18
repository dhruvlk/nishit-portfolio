import { Reveal } from "@/components/animations/reveal";
import { Portrait } from "@/components/common/portrait";
import { ButtonLink } from "@/components/ui/button-link";
import type { Profile } from "@/types/content";

/** Home page preview: portrait + the first part of the short bio. The full story lives on /about. */
export function AboutSection({ profile }: { profile: Profile }) {
  const bio = profile.short_bio || profile.biography;
  const paragraphs = bio.split(/\n{2,}/).filter(Boolean).slice(0, 2);

  return (
    <section id="about" aria-labelledby="about-heading" className="section-y border-t border-line">
      <div className="container-cinema grid items-center gap-14 md:grid-cols-2 lg:gap-24">
        <Portrait url={profile.portrait_url} name={profile.full_name} className="max-w-md md:max-w-none" />

        <Reveal>
          <p className="eyebrow mb-5">About</p>
          <h2 id="about-heading" className="h-section max-w-[16ch]">
            Behind Every Frame, There&apos;s a Story.
          </h2>
          <div className="lead mt-8 max-w-lg space-y-5">
            {paragraphs.length > 0 ? (
              paragraphs.map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <p>A biography hasn&apos;t been added yet.</p>
            )}
          </div>
          <ButtonLink href="/about" variant="ghost" className="mt-10">
            More About Me
          </ButtonLink>
        </Reveal>
      </div>
    </section>
  );
}
