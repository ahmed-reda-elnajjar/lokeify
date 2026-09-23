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
    <div
      className={className}
      style={{
        background: `linear-gradient(155deg, ${accentHex}33 0%, #131318 70%)`,
      }}
    >
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-6xl drop-shadow-lg">{categoryIcon[category]}</span>
      </div>
    </div>
  );
}
