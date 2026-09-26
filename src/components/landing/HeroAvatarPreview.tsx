"use client";

// The landing page's live 3D model: the same rigged avatars the store fit room uses
// (public/models/avatar/*.glb), standing with the built-in idle motion. It turns
// slowly on its own; drag to turn it yourself.

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { AVATARS, avatarTransform, fitAvatar, loadGLB, type AvatarKind } from "@/storefront/lib/models";
import { motionClip } from "@/storefront/lib/motions";
import { estimateBody } from "@/storefront/lib/fit";

const BODY: Record<AvatarKind, { h: number; w: number }> = { male: { h: 178, w: 74 }, female: { h: 168, w: 60 } };

interface Stage {
  pivot: THREE.Group;
  mixer: THREE.AnimationMixer | null;
  figure: THREE.Object3D | null;
  h: number;
}

export default function HeroAvatarPreview() {
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<Stage | null>(null);
  const [who, setWho] = useState<AvatarKind>("male");
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  // Renderer, lights, floor and the render loop: once.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setStatus("failed");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.touchAction = "pan-y";
    renderer.domElement.style.cursor = "grab";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.6;
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8dcd6, 1.2));
    const key = new THREE.DirectionalLight(0xfff6ec, 2.2);
    key.position.set(1.4, 3.2, 2.4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -1;
    key.shadow.camera.right = 1;
    key.shadow.camera.top = 2.2;
    key.shadow.camera.bottom = -0.3;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x10b981, 1.4);
    rim.position.set(-2, 2.2, -2.4);
    scene.add(rim);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(0.7, 64), new THREE.ShadowMaterial({ opacity: 0.22 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const pivot = new THREE.Group();
    scene.add(pivot);
    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 50);
    const st: Stage = { pivot, mixer: null, figure: null, h: 1.78 };
    stage.current = st;

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // Turn: slowly on its own, or by dragging.
    let yaw = 0.35;
    let yawTarget = yaw;
    let dragging = false;
    let lastX = 0;
    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      renderer.domElement.setPointerCapture(e.pointerId);
      renderer.domElement.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      yawTarget += (e.clientX - lastX) * 0.012;
      lastX = e.clientX;
    };
    const up = () => {
      dragging = false;
      renderer.domElement.style.cursor = "grab";
    };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointermove", move);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("pointercancel", up);

    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, clock.getDelta());
      if (!dragging) yawTarget += dt * 0.3;
      yaw += (yawTarget - yaw) * Math.min(1, dt * 8);
      pivot.rotation.y = yaw;
      st.mixer?.update(dt);
      const H = st.h;
      const fov = (camera.fov * Math.PI) / 180;
      const dist = (H * 1.18) / 2 / Math.tan(fov / 2);
      camera.position.set(0, H * 0.52, dist);
      camera.lookAt(0, H * 0.48, 0);
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointermove", move);
      renderer.domElement.removeEventListener("pointerup", up);
      renderer.domElement.removeEventListener("pointercancel", up);
      st.mixer?.stopAllAction();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      stage.current = null;
    };
  }, []);

  // The avatar: the male or female model from the fit room, playing its idle motion.
  useEffect(() => {
    let alive = true;
    setStatus((s) => (s === "failed" ? s : "loading"));
    (async () => {
      try {
        const g = await loadGLB(AVATARS[who]);
        const st = stage.current;
        if (!alive || !st) return;
        const body = estimateBody(BODY[who].h, BODY[who].w);
        const fitted = fitAvatar(g, avatarTransform(g, body));
        const clip = g.animations.find((c) => c.name === "idle") ?? motionClip(fitted.obj, "idle");
        const mixer = new THREE.AnimationMixer(fitted.obj);
        if (clip) mixer.clipAction(clip).play();
        st.mixer?.stopAllAction();
        if (st.figure) st.pivot.remove(st.figure);
        st.pivot.add(fitted.root);
        st.figure = fitted.root;
        st.mixer = mixer;
        st.h = body.h / 100;
        setStatus("ready");
      } catch {
        if (alive) setStatus("failed");
      }
    })();
    return () => {
      alive = false;
    };
  }, [who]);

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-white to-section">
      <div ref={host} className="absolute inset-0" />

      <div className="absolute left-3 top-3 flex overflow-hidden rounded-full border border-border bg-surface/90 text-xs font-medium backdrop-blur">
        {(["male", "female"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setWho(k)}
            className={k === who ? "bg-foreground px-3 py-1.5 text-white" : "px-3 py-1.5 text-muted hover:text-foreground"}
            aria-pressed={k === who}
          >
            {k === "male" ? "Male" : "Female"}
          </button>
        ))}
      </div>

      {status !== "ready" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted">
          {status === "loading" ? "Loading the 3D model…" : "3D preview isn't available on this device."}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-border bg-surface/95 px-4 py-3">
        <span className="text-xs font-medium text-foreground">The fit room&apos;s live 3D model: drag to turn it</span>
        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">LIVE</span>
      </div>
    </div>
  );
}
