"use client";

// PLACEHOLDER ASSET NOTICE:
// This avatar is built entirely from Three.js primitives (capsules, cylinders,
// spheres) rather than a sourced GLB model. Per the phase-1 plan, this stands
// in for a real rigged avatar (e.g. a Ready Player Me export) and real
// clothing GLBs — swap this component's contents for a <primitive object={gltf.scene} />
// once real assets are available. Proportions are driven by computeAvatarScale()
// as a "fake it convincingly" stand-in for real body reconstruction.

import { useMemo } from "react";
import { Measurements, ClothingCategory } from "@/types";
import { computeAvatarScale } from "@/lib/avatarScale";

const SKIN_COLOR = "#c9b79c";

export interface ActiveClothing {
  tshirt: { active: boolean; color: string };
  pants: { active: boolean; color: string };
  jacket: { active: boolean; color: string };
}

interface Props {
  measurements: Measurements;
  clothing: ActiveClothing;
}

export default function AvatarModel({ measurements, clothing }: Props) {
  const scale = useMemo(() => computeAvatarScale(measurements), [measurements]);

  const legHeight = 0.9;
  const hipY = legHeight;
  const torsoHeight = 0.5;
  const shoulderY = hipY + torsoHeight;
  const neckHeight = 0.08;
  const headRadius = 0.13;

  const legRadius = 0.09 * scale.hipFactor;
  const hipOffsetX = 0.12 * scale.hipFactor;
  const torsoRadius = 0.2 * scale.chestFactor;
  const armRadius = 0.06 * scale.bodyWidthScale;
  const armLength = 0.62;
  const shoulderOffsetX = (torsoRadius + 0.06) * scale.shoulderScale;

  const showJacket = clothing.jacket.active;
  const showTshirt = clothing.tshirt.active && !showJacket;
  const showPants = clothing.pants.active;

  return (
    <group scale={[scale.bodyWidthScale, scale.heightScale, scale.bodyWidthScale]}>
      {/* Legs */}
      {[-1, 1].map((side) => (
        <mesh
          key={`leg-${side}`}
          position={[side * hipOffsetX, legHeight / 2, 0]}
          castShadow
        >
          <cylinderGeometry args={[legRadius, legRadius * 0.9, legHeight, 16]} />
          <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} />
        </mesh>
      ))}

      {/* Shoes */}
      {[-1, 1].map((side) => (
        <mesh
          key={`shoe-${side}`}
          position={[side * hipOffsetX, 0.05, 0.05]}
          scale={[scale.shoeScale, 1, scale.shoeScale]}
          castShadow
        >
          <boxGeometry args={[0.14, 0.1, 0.26]} />
          <meshStandardMaterial color="#2b2b2f" roughness={0.5} />
        </mesh>
      ))}

      {/* Pants overlay */}
      {showPants &&
        [-1, 1].map((side) => (
          <mesh
            key={`pants-${side}`}
            position={[side * hipOffsetX, legHeight / 2 + 0.02, 0]}
            castShadow
          >
            <cylinderGeometry
              args={[legRadius * 1.18, legRadius * 1.05, legHeight * 0.95, 16]}
            />
            <meshStandardMaterial color={clothing.pants.color} roughness={0.8} />
          </mesh>
        ))}

      {/* Hip block */}
      <mesh position={[0, hipY, 0]} castShadow>
        <boxGeometry args={[0.32 * scale.hipFactor, 0.16, 0.2]} />
        <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} />
      </mesh>

      {/* Torso */}
      <mesh position={[0, hipY + torsoHeight / 2, 0]} castShadow>
        <capsuleGeometry args={[torsoRadius, torsoHeight * 0.6, 4, 12]} />
        <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} />
      </mesh>

      {/* T-shirt overlay */}
      {showTshirt && (
        <mesh position={[0, hipY + torsoHeight / 2 + 0.02, 0]} castShadow>
          <capsuleGeometry args={[torsoRadius * 1.18, torsoHeight * 0.62, 4, 12]} />
          <meshStandardMaterial color={clothing.tshirt.color} roughness={0.8} />
        </mesh>
      )}

      {/* Jacket overlay (torso) */}
      {showJacket && (
        <mesh position={[0, hipY + torsoHeight / 2 + 0.03, 0]} castShadow>
          <capsuleGeometry args={[torsoRadius * 1.3, torsoHeight * 0.68, 4, 12]} />
          <meshStandardMaterial color={clothing.jacket.color} roughness={0.85} />
        </mesh>
      )}

      {/* Jacket collar */}
      {showJacket && (
        <mesh position={[0, shoulderY + 0.02, 0.05]} castShadow>
          <boxGeometry args={[0.22, 0.08, 0.14]} />
          <meshStandardMaterial color={clothing.jacket.color} roughness={0.85} />
        </mesh>
      )}

      {/* Neck */}
      <mesh position={[0, shoulderY + neckHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, neckHeight, 12]} />
        <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} />
      </mesh>

      {/* Head */}
      <mesh position={[0, shoulderY + neckHeight + headRadius, 0]} castShadow>
        <sphereGeometry args={[headRadius, 24, 24]} />
        <meshStandardMaterial color={SKIN_COLOR} roughness={0.6} />
      </mesh>

      {/* Arms */}
      {[-1, 1].map((side) => (
        <group key={`arm-${side}`} position={[side * shoulderOffsetX, shoulderY - 0.03, 0]}>
          <mesh position={[0, -armLength / 2, 0]} rotation={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[armRadius, armRadius * 0.85, armLength, 14]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} />
          </mesh>

          {/* Jacket sleeve (full arm) */}
          {showJacket && (
            <mesh position={[0, -armLength / 2, 0]} castShadow>
              <cylinderGeometry
                args={[armRadius * 1.35, armRadius * 1.2, armLength * 0.98, 14]}
              />
              <meshStandardMaterial color={clothing.jacket.color} roughness={0.85} />
            </mesh>
          )}

          {/* T-shirt sleeve (short) */}
          {showTshirt && (
            <mesh position={[0, -armLength * 0.18, 0]} castShadow>
              <cylinderGeometry
                args={[armRadius * 1.3, armRadius * 1.25, armLength * 0.32, 14]}
              />
              <meshStandardMaterial color={clothing.tshirt.color} roughness={0.8} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
