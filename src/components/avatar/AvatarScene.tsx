"use client";

import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

interface Props {
  children: React.ReactNode;
}

export default function AvatarScene({ children }: Props) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        camera={{ position: [0, 1.15, 2.6], fov: 35 }}
        className="rounded-2xl"
      >
        <color attach="background" args={["#131318"]} />
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[2, 3, 2]}
          intensity={1.1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-2, 1.5, -1]} intensity={0.3} />

        <Suspense fallback={null}>
          <group position={[0, -0.9, 0]}>{children}</group>
          <ContactShadows
            position={[0, -0.9, 0]}
            opacity={0.5}
            scale={4}
            blur={2.4}
            far={2}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enablePan={false}
          minDistance={1.4}
          maxDistance={4.5}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.7}
          target={[0, 0.15, 0]}
        />
      </Canvas>

      <button
        type="button"
        onClick={() => controlsRef.current?.reset()}
        className="absolute bottom-4 right-4 rounded-full border border-border bg-surface/90 px-3 py-1.5 text-xs font-medium backdrop-blur transition-colors hover:border-brand"
      >
        Reset View
      </button>
    </div>
  );
}
