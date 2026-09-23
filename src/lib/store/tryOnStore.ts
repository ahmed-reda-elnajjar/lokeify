import { create } from "zustand";
import { ClothingCategory, ProductColor } from "@/types";

interface TryOnState {
  category: ClothingCategory;
  color: ProductColor;
  productName: string | null;
  setTryOn: (category: ClothingCategory, color: ProductColor, productName: string) => void;
}

export const useTryOnStore = create<TryOnState>((set) => ({
  category: "tshirt",
  color: { name: "Black", hex: "#1a1a1a" },
  productName: null,
  setTryOn: (category, color, productName) =>
    set({ category, color, productName }),
}));
