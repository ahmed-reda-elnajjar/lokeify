"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MeasurementForm from "@/components/avatar/MeasurementForm";
import PhotoUpload from "@/components/avatar/PhotoUpload";
import GeneratingLoader from "@/components/avatar/GeneratingLoader";
import { useAvatarStore } from "@/lib/store/avatarStore";
import { Measurements } from "@/types";

type Step = "measurements" | "photos" | "generating";

const stepIndex: Record<Step, number> = {
  measurements: 0,
  photos: 1,
  generating: 2,
};

export default function CreateAvatarPage() {
  const router = useRouter();
  const measurements = useAvatarStore((s) => s.measurements);
  const setMeasurements = useAvatarStore((s) => s.setMeasurements);
  const markGenerated = useAvatarStore((s) => s.markGenerated);

  const [step, setStep] = useState<Step>("measurements");
  const [previews, setPreviews] = useState<{
    front: string | null;
    side: string | null;
    face: string | null;
  }>({ front: null, side: null, face: null });

  const handleMeasurementsContinue = (m: Measurements) => {
    setMeasurements(m);
    setStep("photos");
  };

  const handlePhotoSelect = (key: "front" | "side" | "face", file: File) => {
    const url = URL.createObjectURL(file);
    setPreviews((p) => ({ ...p, [key]: url }));
  };

  const handleGenerated = () => {
    markGenerated();
    router.push("/avatar");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Create Your Avatar
        </h1>
        <p className="mt-2 text-sm text-muted">
          Two quick steps — measurements, then photos.
        </p>

        {step !== "generating" && (
          <div className="mt-6 flex gap-2">
            {["measurements", "photos"].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full ${
                  stepIndex[step] >= stepIndex[s as Step]
                    ? "bg-brand"
                    : "bg-surface-2"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {step === "measurements" && (
        <MeasurementForm
          initial={measurements}
          onContinue={handleMeasurementsContinue}
        />
      )}

      {step === "photos" && (
        <PhotoUpload
          previews={previews}
          onSelect={handlePhotoSelect}
          onBack={() => setStep("measurements")}
          onSubmit={() => setStep("generating")}
        />
      )}

      {step === "generating" && <GeneratingLoader onDone={handleGenerated} />}
    </div>
  );
}
