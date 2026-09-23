import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Measurements } from "@/types";

export const DEFAULT_MEASUREMENTS: Measurements = {
  heightCm: 175,
  weightKg: 70,
  chestCm: 96,
  waistCm: 82,
  hipCm: 98,
  shoulderCm: 46,
  shoeSize: 42,
};

interface PhotoPreviews {
  front: string | null;
  side: string | null;
  face: string | null;
}

interface AvatarState {
  measurements: Measurements;
  photoPreviews: PhotoPreviews;
  generated: boolean;
  setMeasurements: (m: Partial<Measurements>) => void;
  setPhotoPreview: (key: keyof PhotoPreviews, url: string | null) => void;
  markGenerated: () => void;
  reset: () => void;
}

export const useAvatarStore = create<AvatarState>()(
  persist(
    (set) => ({
      measurements: DEFAULT_MEASUREMENTS,
      photoPreviews: { front: null, side: null, face: null },
      generated: false,
      setMeasurements: (m) =>
        set((state) => ({ measurements: { ...state.measurements, ...m } })),
      setPhotoPreview: (key, url) =>
        set((state) => ({
          photoPreviews: { ...state.photoPreviews, [key]: url },
        })),
      markGenerated: () => set({ generated: true }),
      reset: () =>
        set({
          measurements: DEFAULT_MEASUREMENTS,
          photoPreviews: { front: null, side: null, face: null },
          generated: false,
        }),
    }),
    {
      name: "lokeify-avatar",
      partialize: (state) => ({
        measurements: state.measurements,
        generated: state.generated,
      }),
    }
  )
);
