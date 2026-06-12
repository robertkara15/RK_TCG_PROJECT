import { usesReprintRule } from "@/lib/catalog/legality";

export function LegalityBadge({
  nameIsStandardLegal,
  legalStandardPrint,
  category,
  compact = false,
}: {
  nameIsStandardLegal: boolean;
  legalStandardPrint?: boolean | null;
  category?: string;
  compact?: boolean;
}) {
  const reprintNote =
    usesReprintRule(category) &&
    nameIsStandardLegal &&
    legalStandardPrint === false &&
    !compact;

  return (
    <div className="space-y-1">
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
          nameIsStandardLegal
            ? "bg-emerald-500/15 text-emerald-300"
            : "bg-red-500/15 text-red-300"
        }`}
      >
        {nameIsStandardLegal ? "Standard Legal" : "Not Standard Legal"}
      </span>
      {reprintNote ? (
        <p className="text-xs text-zinc-500">Legal via reprint rule</p>
      ) : null}
    </div>
  );
}
