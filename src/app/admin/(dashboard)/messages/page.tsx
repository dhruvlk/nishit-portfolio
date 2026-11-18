import { MessagesView } from "@/components/admin/messages-view";
import { getAdminMessages } from "@/lib/data/admin";

export default async function MessagesPage() {
  const messages = await getAdminMessages();
  return <MessagesView initial={messages} />;
}
