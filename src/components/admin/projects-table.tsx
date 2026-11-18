"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, Reorder, motion, useDragControls } from "framer-motion";
import { ArrowDownUp, Eye, EyeOff, Film, GripVertical, Pencil, Plus, Search, Star, StarOff, Trash2, ExternalLink } from "lucide-react";
import { deleteProjectAction, reorderProjectsAction, setProjectFlagsAction } from "@/lib/actions/projects";
import type { Category, Project } from "@/types/content";
import { canOptimizeImage } from "@/lib/utils/media";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Badge, Button, EmptyState, Input, PageHeader, Select } from "@/components/ui/admin-primitives";
import { Dropdown } from "@/components/ui/dropdown";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

type Status = "all" | "published" | "draft" | "featured";

function Thumb({ p }: { p: Project }) {
  return (
    <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded bg-a-raised">
      {p.thumbnail_url ? (
        <Image src={p.thumbnail_url} alt="" fill sizes="80px" className="object-cover" unoptimized={!canOptimizeImage(p.thumbnail_url)} />
      ) : (
        <Film className="absolute inset-0 m-auto size-4 text-a-mute" />
      )}
    </div>
  );
}

function ReorderRow({ p }: { p: Project }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={p}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-3 border-b border-a-line bg-a-panel px-4 py-2 last:border-0"
      whileDrag={{ scale: 1.01, boxShadow: "0 12px 30px rgba(0,0,0,0.15)", zIndex: 10 }}
    >
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab touch-none rounded p-1 text-a-mute hover:bg-a-raised active:cursor-grabbing"
        aria-label={`Drag to reorder ${p.title}`}
      >
        <GripVertical className="size-4" />
      </button>
      <Thumb p={p} />
      <span className="truncate text-sm text-a-fg">{p.title}</span>
      <span className="ml-auto flex gap-1">
        {p.is_featured && <Badge tone="accent">Featured</Badge>}
        <Badge tone={p.is_published ? "success" : "warning"}>{p.is_published ? "Live" : "Draft"}</Badge>
      </span>
    </Reorder.Item>
  );
}

export function ProjectsTable({ projects, categories }: { projects: Project[]; categories: Category[] }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [category, setCategory] = useState("all");
  const [reordering, setReordering] = useState(false);
  const [order, setOrder] = useState(projects);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [savingOrder, startSaving] = useTransition();

  // Keep local order in sync when server data changes (outside reorder mode).
  const [lastProjects, setLastProjects] = useState(projects);
  if (lastProjects !== projects) {
    setLastProjects(projects);
    if (!reordering) setOrder(projects);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (status === "published" && !p.is_published) return false;
      if (status === "draft" && p.is_published) return false;
      if (status === "featured" && !p.is_featured) return false;
      if (category !== "all" && p.category_id !== category) return false;
      if (q && ![p.title, p.slug, p.client_name ?? "", p.category?.name ?? ""].some((s) => s.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [projects, query, status, category]);

  const run = async (id: string, fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    setPendingId(id);
    try {
      const res = await fn();
      if (res.ok) {
        toast.success(res.message ?? "Done");
        router.refresh();
      } else toast.error("Action failed", res.error);
    } catch {
      toast.error("Action failed", "Network error.");
    } finally {
      setPendingId(null);
    }
  };

  const remove = async (p: Project) => {
    const ok = await confirm({
      title: `Delete “${p.title}”?`,
      description: "The project and its uploaded thumbnail and video files will be permanently removed.",
      confirmLabel: "Delete project",
      tone: "danger",
    });
    if (ok) await run(p.id, () => deleteProjectAction(p.id));
  };

  const saveOrder = () =>
    startSaving(async () => {
      const res = await reorderProjectsAction(order.map((p) => p.id)).catch(() => null);
      if (res?.ok) {
        toast.success("Order saved", "The website now uses this order.");
        setReordering(false);
        router.refresh();
      } else toast.error("Could not save order", res && !res.ok ? res.error : "Network error.");
    });

  return (
    <>
      <PageHeader
        title="Projects"
        description={`${projects.length} total · ${projects.filter((p) => p.is_published).length} published`}
        actions={
          reordering ? (
            <>
              <Button onClick={() => { setOrder(projects); setReordering(false); }}>Cancel</Button>
              <Button variant="primary" onClick={saveOrder} loading={savingOrder}>Save order</Button>
            </>
          ) : (
            <>
              <Button onClick={() => { setOrder(projects); setReordering(true); }} disabled={projects.length < 2}>
                <ArrowDownUp className="size-4" /> Reorder
              </Button>
              <Link href="/admin/projects/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-a-fg px-4 text-sm font-medium text-a-bg hover:opacity-90">
                <Plus className="size-4" /> New project
              </Link>
            </>
          )
        }
      />

      {reordering ? (
        <div className="overflow-hidden rounded-xl border border-a-line">
          <p className="border-b border-a-line bg-a-raised px-4 py-2 text-xs text-a-mute">Drag rows by the handle. The top item appears first on the website.</p>
          <Reorder.Group axis="y" values={order} onReorder={setOrder}>
            {order.map((p) => (
              <ReorderRow key={p.id} p={p} />
            ))}
          </Reorder.Group>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-a-mute" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, client, category…" className="pl-9" aria-label="Search projects" />
            </div>
            <Select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="sm:w-40" aria-label="Filter by status">
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="featured">Featured</option>
            </Select>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="sm:w-48" aria-label="Filter by category">
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>

          {projects.length === 0 ? (
            <EmptyState
              icon={<Film className="size-8" />}
              title="No projects yet"
              description="Create your first project — it will appear on the website as soon as you publish it."
              action={<Link href="/admin/projects/new" className="mt-2 text-sm font-medium text-a-accent hover:underline">Create a project</Link>}
            />
          ) : filtered.length === 0 ? (
            <EmptyState title="No matches" description="Try a different search or filter." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-a-line bg-a-panel">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-a-line text-xs text-a-mute">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Project</th>
                    <th scope="col" className="px-4 py-3 font-medium">Category</th>
                    <th scope="col" className="px-4 py-3 font-medium">Status</th>
                    <th scope="col" className="px-4 py-3 font-medium">Updated</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {filtered.map((p) => (
                      <motion.tr
                        key={p.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: pendingId === p.id ? 0.5 : 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b border-a-line last:border-0 hover:bg-a-raised/50"
                      >
                        <td className="px-4 py-3">
                          <Link href={`/admin/projects/${p.id}`} className="flex items-center gap-3">
                            <Thumb p={p} />
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-a-fg">{p.title}</span>
                              <span className="block truncate text-xs text-a-mute">{p.client_name || p.slug}{p.production_year ? ` · ${p.production_year}` : ""}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-a-mute">{p.category?.name ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className="flex flex-wrap gap-1">
                            <Badge tone={p.is_published ? "success" : "warning"}>{p.is_published ? "Published" : "Draft"}</Badge>
                            {p.is_featured && <Badge tone="accent"><Star className="size-3" /> Featured</Badge>}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-a-mute">{formatDate(p.updated_at)}</td>
                        <td className="px-4 py-3">
                          <div className={cn("flex justify-end", pendingId === p.id && "pointer-events-none")}>
                            <Dropdown
                              label={`Actions for ${p.title}`}
                              items={[
                                { label: "Edit", icon: <Pencil className="size-4" />, onSelect: () => router.push(`/admin/projects/${p.id}`) },
                                p.is_published
                                  ? { label: "View on site", icon: <ExternalLink className="size-4" />, onSelect: () => window.open(`/work/${p.slug}`, "_blank", "noopener") }
                                  : { label: "Preview", icon: <Eye className="size-4" />, onSelect: () => window.open(`/admin/projects/${p.id}/preview`, "_blank", "noopener") },
                                {
                                  label: p.is_published ? "Unpublish" : "Publish",
                                  icon: p.is_published ? <EyeOff className="size-4" /> : <Eye className="size-4" />,
                                  onSelect: () => run(p.id, () => setProjectFlagsAction(p.id, { is_published: !p.is_published })),
                                },
                                {
                                  label: p.is_featured ? "Remove from featured" : "Mark as featured",
                                  icon: p.is_featured ? <StarOff className="size-4" /> : <Star className="size-4" />,
                                  onSelect: () => run(p.id, () => setProjectFlagsAction(p.id, { is_featured: !p.is_featured })),
                                },
                                { label: "Delete", icon: <Trash2 className="size-4" />, danger: true, onSelect: () => void remove(p) },
                              ]}
                            />
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
