import dynamic from "next/dynamic";
import { Reveal } from "@/components/animations/reveal";
import { SocialLinks } from "@/components/common/social-links";
import type { Profile, SocialLink } from "@/types/content";

// Form + validation libraries load as a separate chunk.
const ContactForm = dynamic(() => import("./contact-form").then((m) => m.ContactForm), {
  loading: () => <div className="min-h-[560px]" aria-busy="true" />,
});

/** The /contact page: a short introduction and direct details on the left, the form on the right. */
export function ContactSection({ profile, socials }: { profile: Profile; socials: SocialLink[] }) {
  const details = [
    profile.email && { k: "Email", v: profile.email, href: `mailto:${profile.email}` },
    profile.phone && { k: "Phone", v: profile.phone, href: `tel:${profile.phone.replace(/[^\d+]/g, "")}` },
    profile.location && { k: "Location", v: profile.location, href: null },
  ].filter((d): d is { k: string; v: string; href: string | null } => Boolean(d));

  return (
    <section aria-labelledby="contact-heading" className="pb-28 pt-36 sm:pt-44 lg:pb-40">
      <div className="container-cinema grid gap-16 lg:grid-cols-12 lg:gap-12">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow mb-5">Contact</p>
          <h1 id="contact-heading" className="h-page max-w-[12ch]">
            Let&apos;s Create Something Meaningful.
          </h1>
          <p className="lead mt-8 max-w-sm">
            Tell me about the story, the timeline and where it will live. I&apos;ll get back to you shortly.
          </p>

          {details.length > 0 && (
            <dl className="mt-12 space-y-5 border-t border-line pt-8">
              {details.map((d) => (
                <div key={d.k}>
                  <dt className="text-sm text-mute">{d.k}</dt>
                  <dd className="mt-1">
                    {d.href ? (
                      <a href={d.href} className="link-underline -my-2 inline-block py-2">
                        {d.v}
                      </a>
                    ) : (
                      d.v
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <SocialLinks links={socials} className="mt-10" itemClassName="text-sm text-mute hover:text-paper" />
        </Reveal>

        <div className="lg:col-span-6 lg:col-start-7">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
