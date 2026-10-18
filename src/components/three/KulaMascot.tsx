import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";

// Disable modern color management so colors and emissive match r128 prototype faithfully
if (THREE.ColorManagement) {
  THREE.ColorManagement.enabled = false;
}

export interface KulaMascotProps {
  progress: number;
  mood?: "idle" | "sleepy";
  celebrateSignal?: number;
  className?: string;
  onFirstRender?: () => void;
  onError?: (err: Error) => void;
}

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

interface MascotInternalState {
  sleepy: boolean;
  cel: number;
  prog: number;
  progShown: number;
  drag: number;
  dragTarget: number;
  px: number;
  py: number;
  hx: number;
  hy: number;
  nextBlink: number;
  blinkAt: number;
  eyeOpen: number;
}

interface SceneProps {
  progress: number;
  mood: "idle" | "sleepy";
  celebrateSignal?: number;
  pointerRef: React.RefObject<{ px: number; py: number; dragTarget: number; isDown: boolean }>;
  onFirstRender?: () => void;
  triggerCelebrateRef: React.MutableRefObject<(() => void) | null>;
}

const MascotScene: React.FC<SceneProps> = ({
  progress,
  mood,
  celebrateSignal,
  pointerRef,
  onFirstRender,
  triggerCelebrateRef
}) => {
  const { scene, gl } = useThree();
  const firstFrameRef = useRef(true);
  const prevSignalRef = useRef(celebrateSignal);

  const rm = typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  const stateRef = useRef<MascotInternalState>({
    sleepy: mood === "sleepy",
    cel: -1,
    prog: progress,
    progShown: progress,
    drag: 0,
    dragTarget: 0,
    px: 0,
    py: 0,
    hx: 0,
    hy: 0,
    nextBlink: 2,
    blinkAt: -9,
    eyeOpen: 1
  });

  const refsContainer = useRef<{
    root: THREE.Group;
    pivot: THREE.Group;
    shell: THREE.Mesh;
    shadow: THREE.Mesh;
    head: THREE.Group;
    smile: THREE.Mesh;
    sprout: THREE.Group;
    tail: THREE.Mesh;
    eyes: THREE.Group[];
    legs: THREE.Group[];
    plates: THREE.MeshStandardMaterial[];
    inner: THREE.MeshStandardMaterial[];
    sp: { m: THREE.Mesh; v: THREE.Vector3; a: number }[];
    burst: () => void;
    cleanups: (() => void)[];
  } | null>(null);

  // Sync state with props
  useEffect(() => {
    stateRef.current.sleepy = mood === "sleepy";
  }, [mood]);

  useEffect(() => {
    stateRef.current.prog = progress;
    if (progress === 100) {
      refsContainer.current?.burst();
      stateRef.current.cel = 0;
    }
  }, [progress]);

  // Celebrate on signal change
  useEffect(() => {
    if (celebrateSignal !== undefined && celebrateSignal !== prevSignalRef.current) {
      prevSignalRef.current = celebrateSignal;
      stateRef.current.cel = 0;
      refsContainer.current?.burst();
    }
  }, [celebrateSignal]);

  const celebrate = () => {
    stateRef.current.cel = 0;
    refsContainer.current?.burst();
  };

  triggerCelebrateRef.current = celebrate;

  // Build Procedural Scene
  useEffect(() => {
    const cleanups: (() => void)[] = [];
    const geomsToDispose: THREE.BufferGeometry[] = [];
    const matsToDispose: THREE.Material[] = [];

    // Lighting (scaled by PI for modern Three.js)
    const hemi = new THREE.HemisphereLight(0xffffff, 0xd8cdb8, 0.95 * Math.PI);
    const key = new THREE.DirectionalLight(0xfff4e0, 0.85 * Math.PI);
    key.position.set(3, 5, 4);
    const fill = new THREE.DirectionalLight(0xbfd8ff, 0.3 * Math.PI);
    fill.position.set(-4, 2, -3);
    scene.add(hemi, key, fill);
    cleanups.push(() => {
      scene.remove(hemi, key, fill);
      hemi.dispose();
      key.dispose();
      fill.dispose();
    });

    const M = (c: number, r?: number) => {
      const mat = new THREE.MeshStandardMaterial({
        color: c,
        roughness: r == null ? 0.9 : r,
        metalness: 0
      });
      matsToDispose.push(mat);
      return mat;
    };

    const skin = M(0x5FB86B, 0.75);
    const leafM = M(0xB5E08A);
    const cream = M(0xF2E6BC, 0.9);
    const seam = M(0x2B6B48, 0.9);
    const blush = M(0xF4A98A);
    const dark = M(0x2B2A26, 0.4);
    const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
    matsToDispose.push(white);

    // Blob Shadow
    const sc = document.createElement("canvas");
    sc.width = sc.height = 64;
    const g = sc.getContext("2d")!;
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    gr.addColorStop(0, "rgba(0,0,0,.45)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    const shadowTex = new THREE.CanvasTexture(sc);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.5
    });
    matsToDispose.push(shadowMat);
    const shadowGeom = new THREE.PlaneGeometry(4, 4);
    geomsToDispose.push(shadowGeom);
    const shadow = new THREE.Mesh(shadowGeom, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.27;
    scene.add(shadow);
    cleanups.push(() => {
      scene.remove(shadow);
      shadowTex.dispose();
    });

    const root = new THREE.Group();
    const pivot = new THREE.Group();
    scene.add(root);
    root.add(pivot);
    cleanups.push(() => {
      scene.remove(root);
    });

    const SX = 1.1, SY = 0.95, SZ = 1.2;
    const UP = new THREE.Vector3(0, 1, 0);
    const OFF = new THREE.Vector3(0, 0.1, -0.25);

    // Shell
    const shellGeom = new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    geomsToDispose.push(shellGeom);
    const shell = new THREE.Mesh(shellGeom, seam);
    shell.scale.set(SX, SY, SZ);
    shell.position.copy(OFF);
    pivot.add(shell);

    // Body
    const bodyGeom = new THREE.SphereGeometry(1, 32, 16);
    geomsToDispose.push(bodyGeom);
    const body = new THREE.Mesh(bodyGeom, skin);
    body.scale.set(0.98, 0.4, 1.2);
    body.position.set(0, 0.2, -0.2);
    pivot.add(body);

    // Belly
    const bellyGeom = new THREE.SphereGeometry(1, 32, 16);
    geomsToDispose.push(bellyGeom);
    const belly = new THREE.Mesh(bellyGeom, cream);
    belly.scale.set(0.84, 0.24, 1.1);
    belly.position.set(0, 0, -0.2);
    pivot.add(belly);

    // Rim
    const rimGeom = new THREE.TorusGeometry(1, 0.07, 10, 72);
    geomsToDispose.push(rimGeom);
    const rim = new THREE.Mesh(rimGeom, M(0xE9DFA8));
    rim.rotation.x = Math.PI / 2;
    rim.scale.set(SX, SZ, 1);
    rim.position.set(0, OFF.y + 0.02, OFF.z);
    pivot.add(rim);

    // Plates / Scutes
    const plates: THREE.MeshStandardMaterial[] = [];
    const inner: THREE.MeshStandardMaterial[] = [];

    const plate = (phi: number, th: number, r: number, glow: boolean) => {
      const p = new THREE.Vector3(
        Math.sin(phi) * Math.cos(th) * SX,
        Math.cos(phi) * SY,
        Math.sin(phi) * Math.sin(th) * SZ
      );
      const n = new THREE.Vector3(p.x / (SX * SX), p.y / (SY * SY), p.z / (SZ * SZ)).normalize();
      p.add(OFF);

      const mk = (c: number) => {
        const mat = new THREE.MeshStandardMaterial({
          color: c,
          roughness: 0.6,
          metalness: 0,
          emissive: new THREE.Color(0xFFC46B),
          emissiveIntensity: 0
        });
        matsToDispose.push(mat);
        return mat;
      };

      const mat = mk(glow ? 0x3C9A5A : 0x378E55);
      const mat2 = mk(0x5FB874);

      const g1 = new THREE.CylinderGeometry(r, r * 0.9, 0.1, 6);
      const g2 = new THREE.CylinderGeometry(r * 0.66, r * 0.74, 0.05, 6);
      geomsToDispose.push(g1, g2);

      const m = new THREE.Mesh(g1, mat);
      const rg = new THREE.Mesh(g2, mat2);
      rg.position.y = 0.06;
      m.add(rg);

      m.position.copy(p);
      m.quaternion.setFromUnitVectors(UP, n);
      m.rotateY(th);
      pivot.add(m);

      if (glow) {
        plates.push(mat);
        inner.push(mat2);
      }
    };

    for (let i = 0; i < 5; i++) plate(0.62, (i * Math.PI * 2) / 5 + 0.3, 0.31, true);
    plate(0, 0, 0.3, true);
    for (let i2 = 0; i2 < 10; i2++) plate(1.2, (i2 * Math.PI * 2) / 10 + 0.1, 0.25, false);

    // Sprout
    const sprout = new THREE.Group();
    sprout.position.set(0, OFF.y + SY + 0.02, OFF.z);
    pivot.add(sprout);

    const stemGeom = new THREE.CylinderGeometry(0.02, 0.03, 0.2, 8);
    geomsToDispose.push(stemGeom);
    const stem = new THREE.Mesh(stemGeom, leafM);
    stem.position.y = 0.1;
    sprout.add(stem);

    [-1, 1].forEach((s) => {
      const lfGeom = new THREE.SphereGeometry(1, 16, 10);
      geomsToDispose.push(lfGeom);
      const lf = new THREE.Mesh(lfGeom, leafM);
      lf.scale.set(0.17, 0.04, 0.09);
      lf.position.set(s * 0.14, 0.22, 0);
      lf.rotation.z = s * 0.45;
      sprout.add(lf);
    });

    // Head
    const head = new THREE.Group();
    head.position.set(0, 0.4, 0);
    pivot.add(head);

    const neckGeom = new THREE.SphereGeometry(0.4, 20, 14);
    geomsToDispose.push(neckGeom);
    const neck = new THREE.Mesh(neckGeom, skin);
    neck.position.y = -0.02;
    head.add(neck);

    const hbGeom = new THREE.SphereGeometry(0.62, 40, 28);
    geomsToDispose.push(hbGeom);
    const hb = new THREE.Mesh(hbGeom, skin);
    hb.scale.set(1, 0.92, 1);
    hb.position.set(0, 0.12, 0.62);
    head.add(hb);

    const eyes: THREE.Group[] = [];
    [-1, 1].forEach((s) => {
      const e = new THREE.Group();
      e.position.set(s * 0.27, 0.25, 1.13);
      e.rotation.y = s * 0.3;

      const ebGeom = new THREE.SphereGeometry(0.13, 20, 16);
      geomsToDispose.push(ebGeom);
      const eb = new THREE.Mesh(ebGeom, dark);
      eb.scale.set(1, 1.18, 0.55);
      e.add(eb);

      const h1Geom = new THREE.SphereGeometry(0.048, 10, 8);
      geomsToDispose.push(h1Geom);
      const h1 = new THREE.Mesh(h1Geom, white);
      h1.position.set(0.045, 0.06, 0.07);
      e.add(h1);

      const h2Geom = new THREE.SphereGeometry(0.022, 8, 6);
      geomsToDispose.push(h2Geom);
      const h2 = new THREE.Mesh(h2Geom, white);
      h2.position.set(-0.04, -0.05, 0.07);
      e.add(h2);

      head.add(e);
      eyes.push(e);

      const chGeom = new THREE.SphereGeometry(0.09, 12, 10);
      geomsToDispose.push(chGeom);
      const ch = new THREE.Mesh(chGeom, blush);
      ch.scale.set(1.2, 0.75, 0.35);
      ch.position.set(s * 0.43, 0.04, 1.03);
      ch.rotation.y = s * 0.9;
      head.add(ch);

      const nnGeom = new THREE.SphereGeometry(0.02, 8, 6);
      geomsToDispose.push(nnGeom);
      const nn = new THREE.Mesh(nnGeom, dark);
      nn.position.set(s * 0.075, 0.1, 1.235);
      head.add(nn);
    });

    // Smile
    const smileGeom = new THREE.TorusGeometry(0.085, 0.016, 8, 20, Math.PI);
    geomsToDispose.push(smileGeom);
    const smile = new THREE.Mesh(smileGeom, dark);
    smile.rotation.z = Math.PI;
    smile.position.set(0, 0.02, 1.215);
    head.add(smile);

    // Legs
    const legs: THREE.Group[] = [];
    [
      [-1, 0.66, 0.55],
      [1, 0.66, 0.55],
      [-1, 0.72, -0.85],
      [1, 0.72, -0.85]
    ].forEach((c) => {
      const lg = new THREE.Group();
      lg.position.set(c[0] * c[1], 0.1, c[2]);

      const lmGeom = new THREE.SphereGeometry(1, 16, 12);
      geomsToDispose.push(lmGeom);
      const lm = new THREE.Mesh(lmGeom, skin);
      lm.scale.set(0.3, 0.31, 0.34);
      lm.position.y = -0.06;
      lg.add(lm);

      const padGeom = new THREE.SphereGeometry(1, 12, 8);
      geomsToDispose.push(padGeom);
      const pad = new THREE.Mesh(padGeom, cream);
      pad.scale.set(0.22, 0.07, 0.2);
      pad.position.set(0, -0.3, 0.1);
      lg.add(pad);

      for (let k2 = -1; k2 <= 1; k2++) {
        const clGeom = new THREE.SphereGeometry(0.03, 8, 6);
        geomsToDispose.push(clGeom);
        const cl = new THREE.Mesh(clGeom, cream);
        cl.position.set(k2 * 0.1, -0.27, 0.32);
        lg.add(cl);
      }
      pivot.add(lg);
      legs.push(lg);
    });

    // Tail
    const tailGeom = new THREE.ConeGeometry(0.13, 0.36, 12);
    geomsToDispose.push(tailGeom);
    const tail = new THREE.Mesh(tailGeom, skin);
    tail.rotation.x = -Math.PI / 2;
    tail.position.set(0, 0.12, -1.55);
    pivot.add(tail);

    // Sparkles
    const sp: { m: THREE.Mesh; v: THREE.Vector3; a: number }[] = [];
    const cols = [0xD25C34, 0x6FA88A, 0xF6C58A];
    const sparkGeom = new THREE.OctahedronGeometry(0.07);
    geomsToDispose.push(sparkGeom);
    const sparkMats = cols.map((col) => {
      const mat = new THREE.MeshBasicMaterial({ color: col });
      matsToDispose.push(mat);
      return mat;
    });

    for (let j = 0; j < 16; j++) {
      const o = new THREE.Mesh(sparkGeom, sparkMats[j % 3]);
      o.visible = false;
      root.add(o);
      sp.push({ m: o, v: new THREE.Vector3(), a: 9 });
    }

    const burst = () => {
      if (rm) return;
      sp.forEach((s, i) => {
        const a = (i / 16) * 6.283 + Math.random() * 0.4;
        s.v.set(
          Math.cos(a) * (0.8 + Math.random()),
          2.2 + Math.random() * 1.3,
          Math.sin(a) * (0.8 + Math.random()) * 0.6
        );
        s.m.position.set(0, 1.1, 0);
        s.m.visible = true;
        s.a = 0;
      });
    };

    refsContainer.current = {
      root,
      pivot,
      shell,
      shadow,
      head,
      smile,
      sprout,
      tail,
      eyes,
      legs,
      plates,
      inner,
      sp,
      burst,
      cleanups
    };

    return () => {
      cleanups.forEach((c) => c());
      geomsToDispose.forEach((g) => g.dispose());
      matsToDispose.forEach((m) => m.dispose());
      refsContainer.current = null;
    };
  }, [scene, rm]);

  // Animation Loop
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    const rc = refsContainer.current;
    if (!rc) return;

    const dt = Math.min(delta, 0.05);
    timeRef.current += dt;
    const t = timeRef.current;
    const S = stateRef.current;
    const mo = rm ? 0 : 1;

    // Pull pointer info
    if (pointerRef.current) {
      S.px = pointerRef.current.px;
      S.py = pointerRef.current.py;
      S.dragTarget = pointerRef.current.dragTarget;
    }

    // Intro: Mengintip dari tempurung
    const ext = rm ? 1 : ease(clamp((t - 0.25) / 1.4, 0, 1));
    const walk = rm ? 0 : t < 1.8 ? 1 : 0;
    rc.head.position.z = 0.5 * ext;
    rc.head.scale.setScalar(0.85 + 0.15 * ext);

    // Celebrate
    let env = 0, hop = 0;
    if (S.cel >= 0) {
      S.cel += dt;
      const c = S.cel;
      env = Math.exp(-Math.pow(c - 0.5, 2) * 1.2) * (c < 2.6 ? 1 : 0);
      hop = mo * Math.max(0, Math.sin(c * 7)) * 0.38 * Math.exp(-c * 0.9);
      if (c > 2.8) S.cel = -1;
    }

    // Idle bob + napas
    const sl = S.sleepy ? 0.5 : 1;
    const bob = Math.sin(t * 1.6 * sl) * 0.03 * mo;
    rc.pivot.position.y = bob + hop;
    const br = 1 + Math.sin(t * 1.6 * sl) * 0.012 * mo;
    rc.shell.scale.set(1.1 * br, 0.95 * br, 1.2 * br);
    rc.shadow.scale.setScalar(1 - hop * 0.8);
    (rc.shadow.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - hop * 0.9);

    // Arah badan
    S.drag += (S.dragTarget - S.drag) * 0.15;
    if (!pointerRef.current?.isDown) {
      if (pointerRef.current) pointerRef.current.dragTarget *= 0.92;
      S.dragTarget *= 0.92;
    }
    rc.root.rotation.y =
      -0.55 + S.drag + Math.sin(t * 0.5) * 0.07 * mo + (S.cel >= 0 ? Math.sin(S.cel * 9) * 0.12 * env : 0);

    // Kepala menoleh
    S.hx += (S.px * 0.55 - S.hx) * 0.08;
    S.hy += (S.py * 0.25 - S.hy) * 0.08;
    rc.head.rotation.y = S.hx + Math.sin(t * 0.9) * 0.05 * mo;
    rc.head.rotation.x = S.hy * 0.6 - 0.4 * env + (S.sleepy ? 0.18 + Math.sin(t * 0.8) * 0.03 : 0);
    rc.smile.scale.setScalar(1 + 0.7 * env);

    // Kedip dan mata
    if (t > S.nextBlink) {
      S.blinkAt = t;
      S.nextBlink = t + (S.sleepy ? 4 : 2.5) + Math.random() * 3;
    }
    const b = Math.sin(clamp((t - S.blinkAt) / 0.18, 0, 1) * Math.PI);
    S.eyeOpen += ((S.sleepy ? 0.3 : 1) - S.eyeOpen) * 0.1;
    const ey = S.eyeOpen * (1 - b * 0.92) + 0.08 * b;
    rc.eyes.forEach((e) => {
      e.scale.y = Math.max(0.08, ey);
    });

    // Kaki melangkah
    rc.legs.forEach((l, i) => {
      l.rotation.x = Math.sin(t * 6 + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI : 0)) * 0.3 * walk;
    });
    rc.tail.rotation.z = Math.sin(t * 3) * 0.25 * mo;

    // Tunas
    rc.sprout.rotation.z = Math.sin(t * 1.8) * 0.08 * mo + env * 0.2;
    rc.sprout.rotation.y = env * t * 6 * mo;

    // Petak tempurung sesuai progres (6 petak)
    S.progShown += (S.prog - S.progShown) * 0.08;
    const lit = (S.progShown / 100) * 6;
    rc.plates.forEach((m, i) => {
      const baseVal = clamp(lit - i, 0, 1) * (0.5 + 0.08 * Math.sin(t * 2 + i) * mo);
      const wave = env * (0.5 + 0.5 * Math.sin(S.cel * 8 - i * 0.9)) * 0.55;
      const v = baseVal + (S.cel >= 0 ? wave : 0);
      m.emissiveIntensity = v;
      rc.inner[i].emissiveIntensity = v;
    });

    // Percikan perayaan
    rc.sp.forEach((s) => {
      if (s.a >= 1.6) {
        s.m.visible = false;
        return;
      }
      s.a += dt;
      s.v.y -= 4 * dt;
      s.m.position.addScaledVector(s.v, dt);
      s.m.rotation.x += dt * 5;
      s.m.rotation.y += dt * 4;
      s.m.scale.setScalar(Math.max(0.01, 1 - s.a / 1.6));
    });

    if (firstFrameRef.current) {
      firstFrameRef.current = false;
      onFirstRender?.();
    }
  });

  return null;
};

export const KulaMascot: React.FC<KulaMascotProps> = ({
  progress,
  mood = "idle",
  celebrateSignal,
  className = "",
  onFirstRender,
  onError
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const triggerCelebrateRef = useRef<(() => void) | null>(null);

  const pointerState = useRef({
    px: 0,
    py: 0,
    dragTarget: 0,
    isDown: false
  });

  const [isVisible, setIsVisible] = useState(true);

  // Monitor visibility & intersection to pause frameloop when not in view
  useEffect(() => {
    const handleVisChange = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisChange);

    const observer = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver((entries) => {
          if (entries[0]) {
            setIsVisible(entries[0].isIntersecting && !document.hidden);
          }
        })
      : null;

    if (stageRef.current && observer) {
      observer.observe(stageRef.current);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisChange);
      observer?.disconnect();
    };
  }, []);

  // Pointer interactions (drag to rotate, tap to celebrate)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let down = false;
    let moved = 0;
    let lastX = 0;

    const onPointerDown = (e: PointerEvent) => {
      down = true;
      moved = 0;
      lastX = e.clientX;
      pointerState.current.isDown = true;
    };

    const onPointerUp = () => {
      if (down && moved < 6) {
        triggerCelebrateRef.current?.();
      }
      down = false;
      pointerState.current.isDown = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        pointerState.current.px = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
        pointerState.current.py = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      }
      if (down) {
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        moved += Math.abs(dx);
        pointerState.current.dragTarget += dx * 0.012;
      }
    };

    const onPointerLeave = () => {
      pointerState.current.px = 0;
      pointerState.current.py = 0;
    };

    stage.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerleave", onPointerLeave);

    return () => {
      stage.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <div
      ref={stageRef}
      className={`relative w-full h-full select-none ${className}`}
      style={{ touchAction: "pan-y" }}
    >
      <Canvas
        flat
        linear
        dpr={[1, 1.5]}
        frameloop={isVisible ? "always" : "never"}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "low-power"
        }}
        camera={{
          position: [0, 2.4, 7.6],
          fov: 32,
          near: 0.1,
          far: 50
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.domElement.addEventListener("webglcontextlost", (event) => {
            event.preventDefault();
            onError?.(new Error("WebGL context lost"));
          });
        }}
      >
        <MascotScene
          progress={progress}
          mood={mood}
          celebrateSignal={celebrateSignal}
          pointerRef={pointerState}
          onFirstRender={onFirstRender}
          triggerCelebrateRef={triggerCelebrateRef}
        />
      </Canvas>
    </div>
  );
};

export default KulaMascot;
