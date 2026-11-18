"use client";

import { useRouter } from "next/navigation";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import type { ActionResult } from "@/types/content";
import { useToast } from "@/components/ui/toast";

/** Standard submit flow: call the action, map field errors, toast, reset dirty state, refresh. */
export function useSave<T extends FieldValues>(form: UseFormReturn<T>, action: (values: T) => Promise<ActionResult>) {
  const router = useRouter();
  const toast = useToast();
  return form.handleSubmit(
    async (values) => {
      const res = await action(values).catch(() => null);
      if (!res) return toast.error("Not saved", "Network error — please try again.");
      if (!res.ok) {
        for (const [k, msgs] of Object.entries(res.fieldErrors ?? {})) {
          if (msgs?.[0]) form.setError(k as Path<T>, { message: msgs[0] });
        }
        return toast.error("Not saved", res.error);
      }
      toast.success(res.message ?? "Saved", "Changes are live on the website.");
      form.reset(values);
      router.refresh();
    },
    () => toast.error("Check the form", "Some fields need attention."),
  );
}
