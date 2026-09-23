export interface Measurements {
  heightCm: number;
  weightKg: number;
  chestCm: number;
  waistCm: number;
  hipCm: number;
  shoulderCm: number;
  shoeSize: number;
}

export interface AvatarProfile {
  measurements: Measurements;
  photoPreviews: {
    front: string | null;
    side: string | null;
    face: string | null;
  };
  generated: boolean;
  createdAt: string | null;
}

export type ClothingCategory = "tshirt" | "pants" | "jacket";

export interface SizeChartEntry {
  size: string;
  chestMinCm: number;
  chestMaxCm: number;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ClothingCategory;
  price: number;
  currency: string;
  description: string;
  sizes: string[];
  colors: ProductColor[];
  sizeChart: SizeChartEntry[];
  accentHex: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  currency: string;
  size: string;
  color: ProductColor;
  quantity: number;
  accentHex: string;
}

export interface ShippingDetails {
  fullName: string;
  address: string;
  city: string;
  phone: string;
}
