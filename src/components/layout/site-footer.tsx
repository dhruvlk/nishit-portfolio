import { SocialLinks } from "@/components/common/social-links";
import type { Profile, SiteSettings, SocialLink } from "@/types/content";
import { monogram } from "@/lib/utils/monogram";
import { CopyrightYear } from "./copyright-year";

export function SiteFooter({
  settings,
  profile,
  socials,
}: {
  settings: SiteSettings;
  profile: Profile;
  socials: SocialLink[];
}) {
  const name = profile.full_name || settings.site_name;
  return (
    <footer className="border-t border-line">
      <div className="container-cinema flex flex-col gap-10 py-12 md:flex-row md:items-end md:justify-between md:py-14">
        <div className="flex items-center gap-5">
          <span className="font-display text-4xl italic leading-none" aria-hidden>
            {monogram(name)}
          </span>
          <div>
            <p className="text-sm">{name}</p>
            <p className="mt-1 text-sm text-mute">{profile.professional_title}</p>
          </div>
        </div>
        <SocialLinks links={socials} className="md:justify-end" itemClassName="text-sm text-mute hover:text-paper" />
      </div>
      <div className="container-cinema flex flex-col gap-2 border-t border-line py-6 text-xs text-mute sm:flex-row sm:items-center sm:justify-between">
        <p>
          © <CopyrightYear /> {name}. All rights reserved.
        </p>
        {settings.demo_mode && (
          <p className="text-mute/70">
            Demo preview · Sample projects · Footage:{" "}
            <a href="https://mixkit.co" target="_blank" rel="noopener noreferrer" className="link-underline">
              Mixkit
            </a>{" "}
            (free license)
          </p>
        )}
      </div>
    </footer>
  );
}
