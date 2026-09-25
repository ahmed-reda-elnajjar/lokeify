"use client";

import Link from "@/storefront/components/ShopLink";
import { useRouter, useSearchParams } from "@/storefront/lib/navigation";
import { Suspense, useState } from "react";
import { signIn, signOut, toast, useStore } from "@/storefront/lib/store";

export default function SignInPage() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  );
}

/** 4a Sign in · customer and admin accounts share one form; the role decides where you land. */
function SignIn() {
  const s = useStore();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);

  const go = () => {
    // Only follow same-store paths from ?next=.
    const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
    router.push(safe ?? "/");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Enter a valid email address.");
    if (pw.length < 6) return setErr("Passwords are at least 6 characters.");
    if (mode === "up" && !name.trim()) return setErr("Tell us your name.");
    setErr(null);
    setBusy(true);
    try {
      await signIn(email, pw, mode === "up" ? name.trim() : undefined);
      toast(mode === "up" ? "Welcome! Your account is ready." : "Signed in.");
      go();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  const demo = s.shop.slug === "crate";
  const role = s.session.role;

  return (
    <main className="auth">
      <div className="poster">
        <Link href="/" className="brand" style={{ color: "inherit", marginBottom: "auto" }}>{s.shop.name}</Link>
        <span className="display">{mode === "in" ? "SIGN IN" : "JOIN"}</span>
        <p>Members get early access to drops, order tracking and a saved fit profile.</p>
      </div>
      <form className="form" onSubmit={submit} noValidate>
        <div className="seg only-d" style={{ alignSelf: "flex-start" }}>
          <label className="seg-opt"><input type="radio" name="mode" checked={mode === "in"} onChange={() => setMode("in")} /><span>Sign in</span></label>
          <label className="seg-opt"><input type="radio" name="mode" checked={mode === "up"} onChange={() => setMode("up")} /><span>Create account</span></label>
        </div>
        {mode === "up" && (
          <div className="field"><label htmlFor="name">Name</label><input id="name" className="input h48" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></div>
        )}
        <div className="field"><label htmlFor="email">Email</label><input id="email" className="input h48" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
        <div className="field">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <label htmlFor="pw">Password</label>
            {mode === "in" && <button type="button" className="unbtn u" style={{ fontSize: 13 }} onClick={() => toast(`Password reset isn't available yet. Contact ${s.shop.settings.contactEmail || "the store"}.`)}>Forgot?</button>}
          </div>
          <input id="pw" className="input h48" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === "in" ? "current-password" : "new-password"} />
        </div>
        {err && <span className="err-msg" role="alert">{err}</span>}
        <button type="submit" className="btn btn-primary row h56" disabled={busy}><span>{busy ? "One moment…" : mode === "in" ? "Sign in" : "Create account"}</span><span>→</span></button>
        <div className="socials" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button type="button" className="btn btn-secondary h48 google" style={{ justifyContent: "flex-start" }} onClick={() => toast("Google sign-in isn't available for this store yet.")}>Continue with Google</button>
          <button type="button" className="btn btn-secondary h48" style={{ justifyContent: "flex-start" }} onClick={() => toast("Apple sign-in isn't available for this store yet.")}>Continue with Apple</button>
        </div>
        <div className="bt" style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {demo && (
            <>
              <span className="label">Demo account</span>
              <div className="demo">
                <button type="button" className="pick" onClick={() => (setMode("in"), setEmail("sam@example.com"), setPw("demo1234"))}><b>Customer</b><span>sam@example.com · demo1234</span></button>
              </div>
            </>
          )}
          <span style={{ fontSize: 13 }}>
            {s.customer ? <>Signed in as <b>{s.customer.name}</b> · <button type="button" className="unbtn u" onClick={() => void signOut()}>Sign out</button></> : "Not signed in."}
            {role === "admin" && <> · You own this store: <a href={`/admin/${s.shop.slug}`} className="u">open admin</a></>}
          </span>
          <span className="only-m" style={{ fontSize: 13 }}>
            {mode === "in" ? <>No account? <button type="button" className="unbtn u" onClick={() => setMode("up")}>Create one</button></> : <>Have an account? <button type="button" className="unbtn u" onClick={() => setMode("in")}>Sign in</button></>}
          </span>
          <span className="muted" style={{ fontSize: 12 }}>Store owner? Manage this store from your <a href="/login" className="u">Lokeify admin</a>.</span>
        </div>
      </form>
    </main>
  );
}
