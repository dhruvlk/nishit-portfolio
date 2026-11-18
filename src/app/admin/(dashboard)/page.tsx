import Link from "next/link";
import { ArrowRight, Eye, FileEdit, Film, Mail, Star } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/ui/admin-primitives";
import { getDashboardData } from "@/lib/data/admin";
import { formatDate } from "@/lib/utils/format";

export default async function DashboardPage() {
  const { stats, recentProjects, recentMessages } = await getDashboardData();

  const cards = [
    { label: "Total projects", value: stats.total, icon: Film, href: "/admin/projects" },
    { label: "Published", value: stats.published, icon: Eye, href: "/admin/projects" },
    { label: "Drafts", value: stats.drafts, icon: FileEdit, href: "/admin/projects" },
    { label: "Featured", value: stats.featured, icon: Star, href: "/admin/projects" },
    { label: "Messages", value: stats.messages, icon: Mail, href: "/admin/messages", extra: stats.unread ? `${stats.unread} unread` : undefined },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        description="Everything on your portfolio at a glance."
        actions={
          <Link href="/admin/projects/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-a-fg px-4 text-sm font-medium text-a-bg hover:opacity-90">
            New project
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(({ label, value, icon: Icon, href, extra }) => (
          <Link key={label} href={href} className="group rounded-xl border border-a-line bg-a-panel p-5 transition-colors hover:border-a-accent/50">
            <div className="flex items-center justify-between text-a-mute">
              <span className="text-xs">{label}</span>
              <Icon className="size-4" aria-hidden />
            </div>
            <p className="mt-4 text-3xl font-semibold tabular-nums">{value}</p>
            {extra && <p className="mt-1 text-xs text-a-accent">{extra}</p>}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Recent projects" actions={<Link href="/admin/projects" className="inline-flex items-center gap-1 text-xs text-a-mute hover:text-a-fg">All <ArrowRight className="size-3" /></Link>}>
          {recentProjects.length === 0 ? (
            <p className="text-sm text-a-mute">No projects yet. <Link href="/admin/projects/new" className="text-a-accent hover:underline">Create one</Link>.</p>
          ) : (
            <ul className="-my-2 divide-y divide-a-line">
              {recentProjects.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/projects/${p.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-a-accent">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{p.title}</span>
                      <span className="text-xs text-a-mute">Updated {formatDate(p.updated_at)}</span>
                    </span>
                    <Badge tone={p.is_published ? "success" : "warning"}>{p.is_published ? "Published" : "Draft"}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Recent messages" actions={<Link href="/admin/messages" className="inline-flex items-center gap-1 text-xs text-a-mute hover:text-a-fg">All <ArrowRight className="size-3" /></Link>}>
          {recentMessages.length === 0 ? (
            <p className="text-sm text-a-mute">No messages yet.</p>
          ) : (
            <ul className="-my-2 divide-y divide-a-line">
              {recentMessages.map((m) => (
                <li key={m.id}>
                  <Link href="/admin/messages" className="flex items-start justify-between gap-3 py-3 hover:text-a-accent">
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {!m.is_read && <span className="size-1.5 rounded-full bg-a-accent" aria-label="Unread" />}
                        {m.full_name}
                      </span>
                      <span className="line-clamp-1 text-xs text-a-mute">{m.message}</span>
                    </span>
                    <span className="shrink-0 text-xs text-a-mute">{formatDate(m.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
