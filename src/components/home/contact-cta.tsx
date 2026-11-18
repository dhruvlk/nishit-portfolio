import { Reveal } from "@/components/animations/reveal";
import { SocialLinks } from "@/components/common/social-links";
import { ButtonLink } from "@/components/ui/button-link";
import type { Profile, SocialLink } from "@/types/content";

/** Home page closing section: heading, one line, one action. The form lives on /contact. */
export function ContactCta({ profile, socials }: { profile: Profile; socials: SocialLink[] }) {
  return (
    <section id="contact" aria-labelledby="contact-heading" className="section-y border-t border-line">
      <Reveal className="container-cinema flex flex-col items-start gap-8 md:items-center md:text-center">
        <p className="eyebrow">Contact</p>
        <h2 id="contact-heading" className="h-page max-w-[15ch]">
          Let&apos;s Create Something Meaningful.
        </h2>
        <p className="lead max-w-md">Have a story worth telling? Share a few details and let&apos;s talk about bringing it to the screen.</p>
        <div className="mt-2 flex flex-col items-start gap-6 md:items-center">
          <ButtonLink href="/contact">Start a Conversation</ButtonLink>
          {profile.email && (
            <a href={`mailto:${profile.email}`} className="link-underline text-sm text-paper/80">
              {profile.email}
            </a>
          )}
          <SocialLinks links={socials} className="md:justify-center" itemClassName="text-sm text-mute hover:text-paper" />
        </div>
      </Reveal>
    </section>
  );
}
