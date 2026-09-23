import { ClothingCategory } from "@/types";

const categoryIcon: Record<ClothingCategory, string> = {
  tshirt: "👕",
  pants: "👖",
  jacket: "🧥",
};

interface Props {
  category: ClothingCategory;
  accentHex: string;
  className?: string;
}

export default function ProductImagePlaceholder({
  category,
  accentHex,
  className,
}: Props) {
  return (
    <div className={`relative bg-surface-2 ${className ?? ""}`}>
      <span
        className="absolute right-3 top-3 h-3 w-3 rounded-full border border-border"
        style={{ backgroundColor: accentHex }}
      />
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-6xl">{categoryIcon[category]}</span>
      </div>
    </div>
  );
}
