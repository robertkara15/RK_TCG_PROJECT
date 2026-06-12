import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SetDetailView } from "@/components/collection/set-detail-view";
import { auth } from "@/auth";
import {
  getMissingCardsInSet,
  getSetCompletionForUser,
} from "@/lib/catalog/queries";

type PageProps = {
  params: Promise<{ setId: string }>;
  searchParams: Promise<{ view?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { setId } = await params;
  const session = await auth();
  const completion =
    session?.user?.id != null
      ? await getSetCompletionForUser(session.user.id, setId)
      : null;

  return {
    title: completion
      ? `${completion.set.name} — Set progress — RK TCG`
      : "Set progress — RK TCG",
  };
}

export default async function CollectionSetDetailPage({
  params,
  searchParams,
}: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  const { setId } = await params;
  const { view } = await searchParams;
  const [completion, missingPreview] = await Promise.all([
    getSetCompletionForUser(session.user.id, setId),
    getMissingCardsInSet(session.user.id, setId, { page: 1, limit: 1 }),
  ]);

  if (!completion) {
    notFound();
  }

  const initialView =
    view === "owned" ? "owned" : view === "missing" ? "missing" : "all";

  return (
    <SetDetailView
      set={completion.set}
      ownedCount={completion.ownedCount}
      ownedPrintCount={completion.ownedPrintCount}
      completionPercent={completion.completionPercent}
      initialMissingTotal={missingPreview.pagination.total}
      initialView={initialView}
    />
  );
}
