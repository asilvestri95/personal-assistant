"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Package, LogOut, ChevronRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: { name?: string | null; email?: string | null };
  isAdmin?: boolean;
}

const NAV = [
  { label: "Packing Lists", href: "/packing", icon: Package },
];

const ADMIN_NAV = [
  { label: "Admin", href: "/admin", icon: ShieldCheck },
];

export function Sidebar({ user, isAdmin }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-bg-secondary border-r border-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Package className="w-5 h-5 text-accent-blue shrink-0" />
        <span className="text-sm font-semibold text-text-bright truncate">Personal Assistant</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        <div className="px-2 mb-1">
          <p className="text-[10px] uppercase tracking-widest text-text-muted px-2 py-1">Apps</p>
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors group",
                  active
                    ? "bg-bg-active text-text-bright"
                    : "text-text-muted hover:text-text hover:bg-bg-hover"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
              </Link>
            );
          })}
        </div>

        {isAdmin && (
          <div className="px-2 mb-1">
            <p className="text-[10px] uppercase tracking-widest text-text-muted px-2 py-1">Admin</p>
            {ADMIN_NAV.map(({ label, href, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors group",
                    active
                      ? "bg-bg-active text-text-bright"
                      : "text-text-muted hover:text-text hover:bg-bg-hover"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{label}</span>
                  {active && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3 space-y-1">
        <div className="px-2 py-1">
          <p className="text-xs text-text-muted truncate">{user.name}</p>
          <p className="text-[11px] text-text-muted/60 truncate">{user.email}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs text-text-muted hover:text-status-error hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
