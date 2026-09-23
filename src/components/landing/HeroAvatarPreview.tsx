"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import AvatarModel, { ActiveClothing } from "@/components/avatar/AvatarModel";
import { DEFAULT_MEASUREMENTS } from "@/lib/store/avatarStore";

const previewClothing: ActiveClothing = {
  tshirt: { active: true, color: "#1a1a1a" },
  pants: { active: true, color: "#e1e3e5" },
  jacket: { active: false, color: "#1a1a1a" },
};

export default function HeroAvatarPreview() {
  const measurements = useMemo(() => DEFAULT_MEASUREMENTS, []);

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-border bg-surface">
      <Canvas camera={{ position: [0, 1.1, 2.5], fov: 35 }} shadows>
        <color attach="background" args={["#ffffff"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 3, 2]} intensity={1.1} castShadow />
        <directionalLight position={[-2, 1.5, -1]} intensity={0.4} />

        <Suspense fallback={null}>
          <group position={[0, -0.9, 0]}>
            <AvatarModel measurements={measurements} clothing={previewClothing} />
          </group>
          <ContactShadows
            position={[0, -0.9, 0]}
            opacity={0.35}
            scale={4}
            blur={2.4}
            far={2}
          />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={2.2}
          minPolarAngle={Math.PI / 2.6}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-border bg-surface/95 px-4 py-3">
        <span className="text-xs font-medium text-foreground">
          This is a live 3D model — try rotating it
        </span>
        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
          LIVE
        </span>
      </div>
    </div>
  );
}
