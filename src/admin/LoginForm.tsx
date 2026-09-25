"use client";

import { useState } from "react";
import { api } from "./api";
import { Button, Field, Input } from "./ui";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ slug: string | null }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      window.location.href = r.slug ? `/admin/${r.slug}` : "/admin/new";
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Log in failed.");
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div>
          <h1 className="text-2xl font-semibold">Log in</h1>
          <p className="mt-1 text-sm text-muted">Continue to your Lokeify admin.</p>
        </div>
        <Field label="Email">
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password">
          <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {err && <p className="text-sm text-red-700" role="alert">{err}</p>}
        <Button kind="primary" type="submit" disabled={busy} className="py-2.5">
          {busy ? "Logging in…" : "Log in"}
        </Button>
        <p className="text-center text-sm text-muted">
          New to Lokeify? <a href="/signup" className="text-accent hover:underline">Start your store</a>
        </p>
      </form>
      <div className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm">
        <p className="font-medium">Demo store</p>
        <p className="mt-1 text-muted">
          demo@lokeify.com · demo1234 —{" "}
          <button type="button" className="text-accent hover:underline" onClick={() => (setEmail("demo@lokeify.com"), setPassword("demo1234"))}>
            fill in
          </button>
        </p>
      </div>
    </div>
  );
}
