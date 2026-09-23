import { ProductColor } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  colors: ProductColor[];
  selected: ProductColor;
  onSelect: (color: ProductColor) => void;
}

export default function ColorSelector({ colors, selected, onSelect }: Props) {
  return (
    <div className="flex items-center gap-3">
      {colors.map((color) => (
        <button
          key={color.name}
          type="button"
          onClick={() => onSelect(color)}
          title={color.name}
          className={cn(
            "h-9 w-9 rounded-full border-2 transition-transform hover:scale-110",
            selected.name === color.name ? "border-brand" : "border-transparent"
          )}
          style={{ backgroundColor: color.hex }}
        />
      ))}
      <span className="text-sm text-muted">{selected.name}</span>
    </div>
  );
}
