import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem } from "@/types";

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string, colorName: string) => void;
  updateQuantity: (
    productId: string,
    size: string,
    colorName: string,
    quantity: number
  ) => void;
  clearCart: () => void;
}

function sameLine(
  item: CartItem,
  productId: string,
  size: string,
  colorName: string
) {
  return (
    item.productId === productId &&
    item.size === size &&
    item.color.name === colorName
  );
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) =>
            sameLine(i, item.productId, item.size, item.color.name)
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                sameLine(i, item.productId, item.size, item.color.name)
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (productId, size, colorName) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !sameLine(i, productId, size, colorName)
          ),
        })),
      updateQuantity: (productId, size, colorName, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              sameLine(i, productId, size, colorName) ? { ...i, quantity } : i
            )
            .filter((i) => i.quantity > 0),
        })),
      clearCart: () => set({ items: [] }),
    }),
    { name: "lokeify-cart" }
  )
);
