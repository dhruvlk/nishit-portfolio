"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Inbox, Mail, MailOpen, Reply, Search, Trash2 } from "lucide-react";
import { deleteMessageAction, setMessageReadAction } from "@/lib/actions/content";
import type { ContactMessageRow } from "@/types/database";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Badge, Button, EmptyState, Input, PageHeader } from "@/components/ui/admin-primitives";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

type Filter = "all" | "unread" | "read";

export function MessagesView({ initial }: { initial: ContactMessageRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [messages, setMessages] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [lastInitial, setLastInitial] = useState(initial);
  if (lastInitial !== initial) {
    setLastInitial(initial);
    setMessages(initial);
  }

  const unread = messages.filter((m) => !m.is_read).length;
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages.filter((m) => {
      if (filter === "unread" && m.is_read) return false;
      if (filter === "read" && !m.is_read) return false;
      if (q && ![m.full_name, m.email, m.project_type, m.message].some((s) => s.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [messages, filter, query]);
  const selected = messages.find((m) => m.id === selectedId) ?? null;

  const setRead = async (m: ContactMessageRow, isRead: boolean, silent = false) => {
    setMessages((all) => all.map((x) => (x.id === m.id ? { ...x, is_read: isRead } : x)));
    const res = await setMessageReadAction(m.id, isRead).catch(() => null);
    if (!res?.ok) {
      setMessages((all) => all.map((x) => (x.id === m.id ? { ...x, is_read: m.is_read } : x)));
      toast.error("Could not update message", res && !res.ok ? res.error : "Network error.");
      return;
    }
    if (!silent) toast.success(isRead ? "Marked as read" : "Marked as unread");
    router.refresh();
  };

  const open = (m: ContactMessageRow) => {
    setSelectedId(m.id);
    if (!m.is_read) void setRead(m, true, true);
  };

  const remove = async (m: ContactMessageRow) => {
    const ok = await confirm({ title: "Delete this message?", description: `From ${m.full_name} — this cannot be undone.`, confirmLabel: "Delete", tone: "danger" });
    if (!ok) return;
    const res = await deleteMessageAction(m.id).catch(() => null);
    if (res?.ok) {
      setMessages((all) => all.filter((x) => x.id !== m.id));
      setSelectedId(null);
      toast.success("Message deleted");
      router.refresh();
    } else toast.error("Could not delete", res && !res.ok ? res.error : "Network error.");
  };

  return (
    <>
      <PageHeader title="Messages" description={`${messages.length} total · ${unread} unread`} />
      {messages.length === 0 ? (
        <EmptyState icon={<Inbox className="size-8" />} title="No messages yet" description="Contact form submissions from the website will appear here." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-a-mute" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search messages" className="pl-9" aria-label="Search messages" />
              </div>
            </div>
            <div role="tablist" aria-label="Filter messages" className="flex gap-1 rounded-lg border border-a-line bg-a-raised p-1">
              {(["all", "unread", "read"] as const).map((f) => (
                <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={cn("relative flex-1 rounded-md px-3 py-1.5 text-xs font-medium capitalize", filter === f ? "text-a-fg" : "text-a-mute")}>
                  {filter === f && <motion.span layoutId="msg-filter" className="absolute inset-0 rounded-md bg-a-panel shadow-sm" />}
                  <span className="relative">{f}{f === "unread" && unread ? ` (${unread})` : ""}</span>
                </button>
              ))}
            </div>
            <ul className="flex flex-col overflow-hidden rounded-xl border border-a-line bg-a-panel">
              {visible.length === 0 && <li className="p-6 text-center text-sm text-a-mute">Nothing here.</li>}
              {visible.map((m) => (
                <li key={m.id} className="border-b border-a-line last:border-0">
                  <button
                    type="button"
                    onClick={() => open(m)}
                    className={cn("flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-a-raised/60", selectedId === m.id && "bg-a-raised")}
                  >
                    <span className="flex items-center gap-2">
                      {!m.is_read && <span className="size-2 shrink-0 rounded-full bg-a-accent" aria-label="Unread" />}
                      <span className={cn("truncate text-sm", m.is_read ? "text-a-mute" : "font-semibold text-a-fg")}>{m.full_name}</span>
                      <span className="ml-auto shrink-0 text-[11px] text-a-mute">{formatDate(m.created_at)}</span>
                    </span>
                    <span className="truncate text-xs text-a-mute">{m.project_type} · {m.budget_range}</span>
                    <span className="line-clamp-1 text-xs text-a-mute">{m.message}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-h-80 rounded-xl border border-a-line bg-a-panel">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.article key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex h-full flex-col">
                  <header className="flex flex-wrap items-start justify-between gap-3 border-b border-a-line p-5">
                    <div>
                      <h2 className="text-lg font-semibold">{selected.full_name}</h2>
                      <a href={`mailto:${selected.email}`} className="text-sm text-a-accent hover:underline">{selected.email}</a>
                      <p className="mt-1 text-xs text-a-mute">{formatDate(selected.created_at, true)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => void setRead(selected, !selected.is_read)}>
                        {selected.is_read ? <Mail className="size-3.5" /> : <MailOpen className="size-3.5" />}
                        {selected.is_read ? "Mark unread" : "Mark read"}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => void remove(selected)} aria-label="Delete message">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </header>
                  <div className="flex gap-2 px-5 pt-4">
                    <Badge>{selected.project_type}</Badge>
                    <Badge tone="accent">{selected.budget_range}</Badge>
                  </div>
                  <p className="flex-1 whitespace-pre-wrap p-5 text-sm leading-relaxed">{selected.message}</p>
                  <footer className="border-t border-a-line p-4">
                    <a
                      href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.project_type} project`)}`}
                      className="inline-flex h-9 items-center gap-2 rounded-md bg-a-fg px-4 text-sm font-medium text-a-bg hover:opacity-90"
                    >
                      <Reply className="size-4" /> Reply by email
                    </a>
                  </footer>
                </motion.article>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full min-h-80 items-center justify-center p-6 text-sm text-a-mute">
                  Select a message to read it.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </>
  );
}
