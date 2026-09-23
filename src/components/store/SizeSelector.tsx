import { cn } from "@/lib/utils";

interface Props {
  sizes: string[];
  selected: string;
  recommended?: string | null;
  onSelect: (size: string) => void;
}

export default function SizeSelector({
  sizes,
  selected,
  recommended,
  onSelect,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => onSelect(size)}
          className={cn(
            "relative h-11 w-11 rounded-full border text-sm font-medium transition-colors",
            selected === size
              ? "border-brand bg-brand text-white"
              : "border-border text-foreground hover:border-brand"
          )}
        >
          {size}
          {recommended === size && (
            <span className="absolute -top-2 -right-1 rounded-full bg-success px-1.5 py-0.5 text-[9px] font-semibold text-black">
              fit
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
