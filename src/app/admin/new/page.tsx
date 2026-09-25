import SignupForm from "@/admin/SignupForm";

export const metadata = { title: "New store" };

export default function NewStore() {
  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-10">
      <div className="flex w-full max-w-lg flex-col gap-4">
        <a href="/admin" className="text-sm text-muted hover:text-foreground">← Back to admin</a>
        <SignupForm existing />
      </div>
    </div>
  );
}
