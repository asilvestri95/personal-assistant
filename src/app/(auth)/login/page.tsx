"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Package } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/packing");
      router.refresh();
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
          <p className="text-text-muted text-sm">Sign in to your account</p>
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-text-muted uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  className="vscode-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-text-muted uppercase tracking-wide">Password</label>
                <input
                  type="password"
                  className="vscode-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="text-xs text-status-error bg-red-900/20 border border-status-error/30 rounded px-3 py-2">
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} className="vscode-btn-primary w-full justify-center">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Sign In
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-text-muted mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-text-link hover:underline">
            Register with invite code
          </Link>
        </p>
      </div>
    </div>
  );
}
