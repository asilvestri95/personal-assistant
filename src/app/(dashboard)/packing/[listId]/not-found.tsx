import Link from "next/link";
import { Package } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-center">
      <Package className="w-12 h-12 text-text-muted/30 mb-4" />
      <h2 className="text-lg font-semibold text-text-bright mb-1">List not found</h2>
      <p className="text-text-muted text-sm mb-6">This packing list doesn&apos;t exist or you don&apos;t have access.</p>
      <Link href="/packing" className="vscode-btn-primary">Back to lists</Link>
    </div>
  );
}
