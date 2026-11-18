import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-ink px-6 text-center">
      <p className="eyebrow">404</p>
      <h1 className="h-page">This frame didn&apos;t make the cut.</h1>
      <p className="lead max-w-sm">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link href="/" className="btn btn-ghost mt-4">
        Back to home
      </Link>
    </main>
  );
}
