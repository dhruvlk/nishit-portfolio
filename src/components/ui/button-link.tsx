import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** The site's only button style: solid (primary) or hairline (ghost). */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  return (
    <Link href={href} className={cn("btn", variant === "primary" ? "btn-primary" : "btn-ghost", className)}>
      {children}
    </Link>
  );
}
