export default function NotFound() {
  return (
    <main style={{ padding: "96px 32px", display: "flex", flexDirection: "column", gap: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 48, margin: 0 }}>Page not found.</h1>
      <p style={{ margin: 0 }}>There is nothing at this address — the store or page may have moved.</p>
      <a href="/" style={{ textDecoration: "underline" }}>Go to Lokeify →</a>
    </main>
  );
}
