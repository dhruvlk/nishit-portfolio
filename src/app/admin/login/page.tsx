import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4">
      <LoginForm />
      <Link href="/" className="text-xs text-a-mute hover:text-a-fg">← Back to website</Link>
    </main>
  );
}
