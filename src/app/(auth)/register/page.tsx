"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Package } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", inviteCode: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Registration failed.");
    } else {
      router.push("/login?registered=1");
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-7 h-7 text-accent-blue" />
            <span className="text-xl font-semibold text-text-bright">Personal Assistant</span>
          </div>
          <p className="text-text-muted text-sm">Create your account</p>
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-text-muted uppercase tracking-wide">Name</label>
                <input className="vscode-input" placeholder="Your name" value={form.name} onChange={update("name")} required />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-text-muted uppercase tracking-wide">Email</label>
                <input type="email" className="vscode-input" placeholder="you@example.com" value={form.email} onChange={update("email")} required />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-text-muted uppercase tracking-wide">Password</label>
                <input type="password" className="vscode-input" placeholder="Min 8 characters" value={form.password} onChange={update("password")} required minLength={8} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-text-muted uppercase tracking-wide">Invite Code</label>
                <input className="vscode-input font-mono" placeholder="XXXX-XXXX" value={form.inviteCode} onChange={update("inviteCode")} required />
              </div>

              {error && (
                <p className="text-xs text-status-error bg-red-900/20 border border-status-error/30 rounded px-3 py-2">
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} className="vscode-btn-primary w-full justify-center">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Create Account
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-text-muted mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-text-link hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
