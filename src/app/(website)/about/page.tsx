import type { Metadata } from "next";
import Image from "next/image";
import { PhilosophySection } from "@/components/about/philosophy-section";
import { WorkflowSection } from "@/components/about/workflow-section";
import { ImageReveal } from "@/components/animations/image-reveal";
import { Reveal } from "@/components/animations/reveal";
import { Portrait } from "@/components/common/portrait";
import { ExpertiseSection } from "@/components/home/expertise-section";
import { getProfile } from "@/lib/data/public";
import { canOptimizeImage } from "@/lib/utils/media";

export async function generateMetadata(): Promise<Metadata> {
  const p = await getProfile();
  return {
    title: "About",
    description: p.intro || p.short_bio || `${p.full_name} — ${p.professional_title}`,
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const profile = await getProfile();
  const lead = profile.about_images[0];
  const bio = (profile.biography || profile.short_bio).split(/\n{2,}/).filter(Boolean);

  return (
    <>
      {/* 1. Introduction */}
      <header className="container-cinema pb-16 pt-36 sm:pt-44 md:pb-24">
        <Reveal className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-5">About</p>
            <h1 className="h-page">{profile.full_name || "About"}</h1>
            <p className="mt-4 text-lg text-mute">{profile.professional_title}</p>
          </div>
          {(profile.intro || profile.tagline) && (
            <p className="lead max-w-md lg:col-span-4 lg:col-start-9">{profile.intro || profile.tagline}</p>
          )}
        </Reveal>
      </header>

      {lead && (
        <figure className="container-cinema">
          <ImageReveal className="aspect-[16/9] w-full bg-ink-2 md:aspect-[21/9]">
            <Image
              data-media
              src={lead.url}
              alt={lead.caption || "Behind the scenes"}
              fill
              priority
              sizes="(min-width: 1440px) 1312px, 100vw"
              className="object-cover"
              unoptimized={!canOptimizeImage(lead.url)}
            />
          </ImageReveal>
        </figure>
      )}

      {/* 2. Biography */}
      <section aria-labelledby="bio-heading" className="section-y">
        <div className="container-cinema grid gap-14 md:grid-cols-12 lg:gap-12">
          <div className="md:col-span-5 lg:col-span-4">
            <Portrait url={profile.portrait_url} name={profile.full_name} className="max-w-sm md:sticky md:top-28 md:max-w-none" />
          </div>
          <Reveal className="md:col-span-7 lg:col-span-6 lg:col-start-7">
            <p className="eyebrow mb-5">Biography</p>
            <h2 id="bio-heading" className="h-section max-w-[16ch]">
              {profile.tagline || "Behind Every Frame, There's a Story."}
            </h2>
            <div className="mt-10 space-y-6 text-lg leading-relaxed text-paper/80">
              {bio.length > 0 ? bio.map((p, i) => <p key={i}>{p}</p>) : <p className="text-mute">A biography hasn&apos;t been added yet.</p>}
            </div>
            {profile.clients.length > 0 && (
              <div className="mt-12 border-t border-line pt-8">
                <p className="mb-3 text-sm text-mute">Selected clients</p>
                <p className="text-lg">{profile.clients.join(" · ")}</p>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* 3. Philosophy  4. Workflow  5. Expertise */}
      <PhilosophySection text={profile.philosophy} />
      <WorkflowSection steps={profile.workflow} approach={profile.approach} />
      <ExpertiseSection items={profile.expertise} detailed />
    </>
  );
}
