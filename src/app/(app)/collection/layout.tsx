import { CollectionNav } from "@/components/collection/collection-nav";

export default function CollectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <CollectionNav />
      {children}
    </div>
  );
}
