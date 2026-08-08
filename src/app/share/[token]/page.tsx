import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Package, MapPin, Calendar, CheckSquare, Square } from "lucide-react";
import Link from "next/link";

export default async function SharedListPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();

  const list = await db.packingList.findUnique({
    where: { shareToken: token },
    include: {
      user: { select: { name: true } },
      items: { orderBy: [{ category: "asc" }, { sortOrder: "asc" }] },
      shares: { select: { userId: true } },
    },
  });

  if (!list) notFound();

  // Check access
  if (list.shareType === "INVITE_ONLY") {
    if (!session) notFound();
    const hasAccess =
      list.userId === session.user.id ||
      list.shares.some((s) => s.userId === session.user.id);
    if (!hasAccess) notFound();
  }

  // Group by category
  const grouped = list.items.reduce<Record<string, typeof list.items>>((acc, item) => {
    const key = item.category || "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
  const categories = Object.keys(grouped).sort();

  const packed = list.items.filter((i) => i.packed).length;
  const total = list.items.length;

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="border-b border-border bg-bg-secondary">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-accent-blue" />
            <span className="text-sm font-semibold text-text-bright">Personal Assistant</span>
          </div>
          {session ? (
            <Link href="/packing" className="text-xs text-text-link hover:underline">My lists →</Link>
          ) : (
            <Link href="/login" className="text-xs text-text-link hover:underline">Sign in →</Link>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* List header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-text-bright mb-1">{list.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
            {list.user.name && <span>Shared by {list.user.name}</span>}
            {list.destination && (
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{list.destination}</span>
            )}
            {list.startDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(list.startDate)}{list.endDate && ` – ${formatDate(list.endDate)}`}
              </span>
            )}
            <span>{packed} of {total} items packed</span>
          </div>
          {total > 0 && (
            <div className="mt-3 h-1.5 bg-bg-tertiary rounded-full overflow-hidden max-w-xs">
              <div
                className="h-full bg-accent-green rounded-full"
                style={{ width: `${Math.round((packed / total) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Items by category */}
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category} className="card overflow-hidden">
              <div className="px-4 py-2.5 bg-bg-tertiary border-b border-border flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">{category}</span>
                <span className="text-xs text-text-muted">{grouped[category].length} items</span>
              </div>

              {/* Column headers */}
              <div className="grid px-4 py-1.5 border-b border-border bg-bg-secondary text-[10px] uppercase tracking-wide text-text-muted/60"
                style={{ gridTemplateColumns: "1fr 48px 96px 80px 80px 1fr" }}>
                <span>Item</span>
                <span className="text-center">Qty</span>
                <span>Bag</span>
                <span className="text-center">Gathered</span>
                <span className="text-center">Packed</span>
                <span>Notes</span>
              </div>

              <div className="divide-y divide-border">
                {grouped[category].map((item) => (
                  <div
                    key={item.id}
                    className="grid px-4 py-2 gap-2 items-center"
                    style={{ gridTemplateColumns: "1fr 48px 96px 80px 80px 1fr" }}
                  >
                    <span className={`text-sm ${item.packed ? "line-through text-text-muted" : "text-text"}`}>
                      {item.name}
                    </span>
                    <span className="text-xs text-text-muted text-center">{item.quantity}×</span>
                    <span className="text-xs text-text-muted truncate">{item.bag ?? "—"}</span>
                    <span className="flex justify-center">
                      {item.gathered
                        ? <CheckSquare className="w-4 h-4 text-accent-green" />
                        : <Square className="w-4 h-4 text-text-muted/30" />}
                    </span>
                    <span className="flex justify-center">
                      {item.packed
                        ? <CheckSquare className="w-4 h-4 text-accent-blue" />
                        : <Square className="w-4 h-4 text-text-muted/30" />}
                    </span>
                    <span className="text-xs text-text-muted truncate">
                      {item.preTripNotes || item.postTripNotes || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
