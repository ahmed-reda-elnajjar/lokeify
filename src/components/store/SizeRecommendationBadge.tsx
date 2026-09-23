import Link from "next/link";
import { SizeRecommendation } from "@/lib/sizeRecommendation";

interface Props {
  recommendation: SizeRecommendation | null;
}

export default function SizeRecommendationBadge({ recommendation }: Props) {
  if (!recommendation) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-muted">
        Create your avatar to get a personal size recommendation for this
        item.{" "}
        <Link href="/create-avatar" className="text-brand hover:underline">
          Create Avatar
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
      <span className="mt-0.5 text-lg">✓</span>
      <div>
        <p className="text-sm font-medium">
          Recommended Size: <span className="text-success">{recommendation.size}</span>
        </p>
        <p className="mt-1 text-xs text-muted">{recommendation.note}</p>
      </div>
    </div>
  );
}
