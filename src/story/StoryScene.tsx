import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { story, actAt, actCount, smooth, ramp, theme } from "./state";
import { noise } from "../journey/glsl";
import { makeGlowTexture, atlasGrid } from "../journey/textures";
import { makeDashboard, makeHoloPanels, makeLockScreen, makeMarquee, panelSize } from "./canvas";
import { ORBIT, aboveApps, belowApps, brandGrid, brands, makeBrandAtlas, makeBrandCardAtlas, networkApps } from "./brands";
import { sfx } from "./sound";

/* ------------------------------------------------------------------------------------------------
 * Timeline (act positions, 0 to 5)
 *   0      the phone, dark, floating
 *   0.5    screen wakes, notifications pile up and burst out
 *   1.5    the camera dives through the screen
 *   2      slot machine: every app spinning
 *   2.3-3  reels stop one by one on the payline
 *   3      icons fly out into a network around a glowing sphere
 *   3.6-4  the sphere opens like a lens; the Orbit hologram materialises
 *   4.3-5  pull back out through the screen; the phone now runs Orbit and projects a hologram
 * ---------------------------------------------------------------------------------------------- */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const C = V(0, 0, -30); // the world inside the phone
const col = (hex: string) => new THREE.Color(hex);
const outro = "\n#include <colorspace_fragment>\n";

/**
 * The Oat scheme, for both modes. Petrol lights the world, coral and honey run the machine.
 * Names are kept from the scene's first palette: `violet` is the main world colour, `rose` the machine accent.
 */
const palettes = {
  dark: {
    rose: "#F07A68",
    roseSoft: "#F6B3A6",
    violet: "#5CC9BC",
    deep: "#0C6B66",
    blue: "#1B8078",
    ice: "#DDF4EF",
    heather: "#BBA3DD",
    gold: "#FFD27A",
    goldHot: "#FFB84D",
    spark: "#FFF4E0",
    flash: "#FFD9A0",
    clear: "#121110",
    body: "#2B2926",
    buttons: "#3A3733",
    frame: "#221F1C",
    frameMetal: 0.75,
    backplate: "#0B0A09",
    lever: "#BDB6AA",
    reelA: [0.07, 0.064, 0.058],
    reelB: [0.115, 0.105, 0.095],
    reelSep: 0.05,
    holoTint: "#DDF7F2",
    studio: ["#2A2724", "#1A1917", "#0D0C0B"],
    shadow: "#000000",
    shadowOpacity: 0.7,
  },
  light: {
    rose: "#C8503F",
    roseSoft: "#C8503F",
    violet: "#1A8C84",
    deep: "#0C6B66",
    blue: "#0C6B66",
    ice: "#6CC4B8",
    heather: "#6B4F8F",
    gold: "#E0A640",
    goldHot: "#D08A2A",
    spark: "#8C5C00",
    flash: "#E4B458",
    clear: "#F2EFE9",
    body: "#2B2926",
    buttons: "#3A3733",
    frame: "#E2DBCE",
    frameMetal: 0.25,
    backplate: "#D6CFC3",
    lever: "#9C958A",
    reelA: [0.8, 0.77, 0.72],
    reelB: [0.95, 0.94, 0.91],
    reelSep: -0.12,
    holoTint: "#5CC9BC",
    studio: ["#FBFAF7", "#F1EEE8", "#E2DDD3"],
    shadow: "#3A3226",
    shadowOpacity: 0.32,
  },
};
let pal = palettes.dark;
const isLight = () => theme.mode === "light";

/**
 * In light mode, additive glow disappears into the paper. This turns an additive shader into ink:
 * the glow's brightness becomes opacity and its hue is drawn as a deep tone with normal blending.
 */
const INK = `
#ifdef INK
  { vec3 e = gl_FragColor.rgb * gl_FragColor.a; float m = max(max(e.r, e.g), e.b);
    gl_FragColor = vec4(e / max(m, 1e-4) * INK_TONE, clamp(m * INK_GAIN, 0., 1.)); }
#endif
`;
function ink<T extends THREE.ShaderMaterial>(m: T, gain = 1.4, tone = 0.12): T {
  if (!isLight()) return m;
  m.blending = THREE.NormalBlending;
  m.defines = { ...m.defines, INK: "", INK_TONE: tone.toFixed(3), INK_GAIN: gain.toFixed(3) };
  m.fragmentShader = m.fragmentShader.replace("#include <colorspace_fragment>", `${INK}\n#include <colorspace_fragment>`);
  return m;
}
const glowBlend = () => (isLight() ? THREE.NormalBlending : THREE.AdditiveBlending);

type Key = { pos: THREE.Vector3; look: THREE.Vector3; desk: [number, number]; mob: [number, number]; m: number };

const keys: Key[] = [
  { pos: V(0, 0.3, 17), look: V(0, 0, 0), desk: [0.2, 0], mob: [0, -0.2], m: 1.7 },
  { pos: V(0, 0, 12), look: V(0, 0, 0), desk: [0.2, 0], mob: [0, -0.17], m: 1.6 },
  { pos: V(0, 0.3, -0.4), look: C, desk: [0.15, 0], mob: [-0.06, -0.14], m: 1 },
  { pos: V(-5, 2.5, -9), look: C, desk: [-0.2, 0], mob: [0, 0.2], m: 1.4 },
  { pos: V(0, 0, -15.5), look: C, desk: [0, -0.16], mob: [0, -0.2], m: 1 },
  // V: back out through the glass; the phone now runs Orbit.
  { pos: V(0, 5, 31), look: V(0, 1.6, 0), desk: [0, 0.2], mob: [0, 0.3], m: 1.5 },
  // Inside Orbit: the camera drifts in around the phone while each feature is shown.
  { pos: V(-9.5, 3.5, 17.5), look: V(0, 0.6, 0), desk: [-0.25, 0.02], mob: [0, 0.3], m: 1.5 },
  { pos: V(9.5, 2.2, 15.5), look: V(0, 0.3, 0), desk: [0.25, 0], mob: [0, 0.3], m: 1.5 },
  { pos: V(-8.5, 0.8, 15), look: V(0, 0, 0), desk: [-0.25, 0], mob: [0, 0.3], m: 1.5 },
  { pos: V(8.5, 4.5, 17), look: V(0, 0.8, 0), desk: [0.25, 0], mob: [0, 0.3], m: 1.5 },
  // Join: pull back to the phone and its hologram above the call to action.
  { pos: V(0, 5, 31), look: V(0, 1.6, 0), desk: [0, 0.3], mob: [0, 0.35], m: 1.5 },
];

const curve = (pts: THREE.Vector3[]) => new THREE.CatmullRomCurve3(pts, false, "centripetal");
const deskPos = curve(keys.map((k) => k.pos));
const mobPos = curve(keys.map((k) => k.look.clone().add(k.pos.clone().sub(k.look).multiplyScalar(k.m))));
const lookCurve = curve(keys.map((k) => k.look));

const live = { k: 0, prevK: 0, time: 0, mobile: false, inner: 1, shake: 0 };
/** True on the frame the story passes act position a going forward. */
const crossed = (a: number) => live.prevK < a && live.k >= a;

/** One shared app-icon atlas for the reels and the flying icons. */
let brandAtlas: Promise<THREE.Texture> | null = null;
const getBrandAtlas = () => (brandAtlas ??= Promise.resolve().then(makeBrandAtlas));

/* Phone dimensions */
const PH = { w: 3.6, h: 7.6, depth: 0.34, bevel: 0.06, screenW: 3.34, screenH: 7.32 };
const screenZ = PH.depth / 2 + PH.bevel + 0.004;
const finalTilt = -0.65;

function roundedShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function rotAxis(v: THREE.Vector3, axis: THREE.Vector3, a: number) {
  return v.applyAxisAngle(axis, a);
}

/* ------------------------------------------------------------------------------------------------
 * Camera
 * ---------------------------------------------------------------------------------------------- */

function Rig({ reduce }: { reduce: boolean }) {
  const { camera, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const s = useRef({ k: 0, px: 0, py: 0, start: -1, lastDz: 0, moving: 0 });
  const tmp = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3(), a: new THREE.Vector3(), r: new THREE.Vector3(), u: new THREE.Vector3() }), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const st = s.current;
    const t = state.clock.elapsedTime;
    if (st.start < 0) st.start = t;
    live.time = t;
    live.mobile = size.width / size.height < 0.8;
    live.inner = live.mobile ? 0.5 : 1;

    live.prevK = st.k;
    st.k += (actAt(story.progress) - st.k) * (1 - Math.exp(-dt * (reduce ? 20 : 4.5)));
    const k = st.k;
    live.k = k;
    const u = Math.min(1, Math.max(0, k / (actCount - 1)));
    (live.mobile ? mobPos : deskPos).getPoint(u, tmp.pos);
    lookCurve.getPoint(u, tmp.look);

    // Dives through the screen run dead centre.
    const dive = Math.max(ramp(1.15, 1.4, 1.75, 1.95, k), ramp(4.3, 4.45, 4.7, 4.85, k));
    tmp.pos.x *= 1 - dive;
    tmp.look.x *= 1 - dive;

    // Opening approach: the camera eases in from a distance.
    const intro = reduce ? 1 : Math.min(1, (t - st.start) / 2.4);
    tmp.pos.z += (1 - (1 - Math.pow(1 - intro, 3))) * 18;

    st.px += (story.pointer.x - st.px) * (1 - Math.exp(-dt * 2.5));
    st.py += (story.pointer.y - st.py) * (1 - Math.exp(-dt * 2.5));
    cam.position.copy(tmp.pos);
    cam.lookAt(tmp.look);
    if (!reduce) {
      const par = 1 - dive;
      tmp.r.setFromMatrixColumn(cam.matrixWorld, 0);
      tmp.u.setFromMatrixColumn(cam.matrixWorld, 1);
      cam.position.addScaledVector(tmp.r, st.px * 0.7 * par).addScaledVector(tmp.u, st.py * 0.45 * par);
      cam.lookAt(tmp.look);
    }
    cam.fov = 45 + dive * 12;
    // Jackpot shake.
    if (live.shake > 0 && !reduce) {
      cam.position.x += Math.sin(t * 71) * live.shake * 0.12;
      cam.position.y += Math.cos(t * 53) * live.shake * 0.1;
    }

    const i = Math.min(actCount - 2, Math.floor(k));
    // Hold the machine in place through the jackpot before panning to the network.
    const f = i === 2 ? smooth(0.5, 0.95, k - i) : smooth(0, 0.5, k - i);
    const a = live.mobile ? keys[i].mob : keys[i].desk;
    const b = live.mobile ? keys[i + 1].mob : keys[i + 1].desk;
    const sx = (a[0] + (b[0] - a[0]) * f) * (1 - dive);
    const sy = (a[1] + (b[1] - a[1]) * f) * (1 - dive);
    cam.setViewOffset(size.width, size.height, -sx * size.width, sy * size.height, size.width, size.height);
    cam.updateProjectionMatrix();

    // White-violet flashes as we cross the screen and when the machine collapses.
    const dz = cam.position.z - screenZ;
    if (st.lastDz !== 0 && Math.sign(dz) !== Math.sign(st.lastDz) && k > 1) sfx.whoosh();
    st.lastDz = dz;
    if (crossed(0.47)) sfx.ping();
    if (crossed(2.72)) sfx.swell();
    if (crossed(3.52)) sfx.shimmer();
    if (crossed(4.8)) sfx.powerUp();
    // Only while actually travelling through the glass, not while parked just behind it.
    const transit = Math.max(ramp(1.2, 1.35, 1.85, 1.97, k), ramp(4.2, 4.35, 4.75, 4.9, k));
    // ...and only while the camera is moving, so stopping just behind the glass never leaves a haze.
    const speed = Math.abs(k - live.prevK) / Math.max(dt, 1e-3);
    st.moving += (smooth(0.04, 0.35, speed) - st.moving) * (1 - Math.exp(-dt * 6));
    const cross = transit * Math.exp(-dz * dz * 0.9) * st.moving;
    const flash = Math.max(cross * 0.85, ramp(2.72, 2.8, 2.8, 2.95, k) * 0.5);
    const el = document.getElementById("story-flash");
    if (el) el.style.opacity = flash.toFixed(3);

    if (!story.ready && t > 0.05) {
      story.ready = true;
      window.dispatchEvent(new Event("story:ready"));
    }
  }, -1);
  return null;
}

/* ------------------------------------------------------------------------------------------------
 * Backdrop
 * ---------------------------------------------------------------------------------------------- */

/** A soft studio sweep: lighter behind the subject, falling off to the edges. Fixed to the screen. */
function Backdrop() {
  const { scene } = useThree();
  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 1024;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(512, 440, 0, 512, 520, 760);
    grad.addColorStop(0, pal.studio[0]);
    grad.addColorStop(0.55, pal.studio[1]);
    grad.addColorStop(1, pal.studio[2]);
    g.fillStyle = grad;
    g.fillRect(0, 0, 1024, 1024);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    scene.background = t;
    return () => {
      scene.background = null;
      t.dispose();
    };
  }, [scene]);
  return null;
}

/** A soft contact shadow under the phone, like a product shot. */
function Shadow() {
  const { mat } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, "rgba(0,0,0,1)");
    grad.addColorStop(0.35, "rgba(0,0,0,0.55)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const map = new THREE.CanvasTexture(c);
    const mat = new THREE.MeshBasicMaterial({ map, color: pal.shadow, transparent: true, depthWrite: false, opacity: 0 });
    return { mat };
  }, []);
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const k = live.k;
    const vis = (1 - smooth(1.1, 1.4, k)) + smooth(4.6, 4.95, k);
    // The phone lifts slightly at the end, so the shadow softens and spreads.
    const lift = smooth(4.65, 4.98, k);
    mat.opacity = Math.min(1, vis) * (pal.shadowOpacity - lift * pal.shadowOpacity * 0.35);
    if (mesh.current) {
      mesh.current.visible = mat.opacity > 0.001;
      mesh.current.scale.set(1 + lift * 0.4 + Math.sin(live.time * 0.8) * 0.02, 1 + lift * 0.3, 1);
    }
  });
  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.2, 0]} material={mat}>
      <planeGeometry args={[9, 4.2]} />
    </mesh>
  );
}

function Glow({ glow, color, scale, opacity }: { glow: THREE.Texture; color: string; scale: number; opacity: number }) {
  return (
    <sprite scale={[scale, scale, 1]}>
      <spriteMaterial map={glow} color={color} transparent opacity={isLight() ? opacity * 0.35 : opacity} blending={glowBlend()} depthWrite={false} />
    </sprite>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Act I and V: the phone
 * ---------------------------------------------------------------------------------------------- */

function Phone({ glow }: { glow: THREE.Texture }) {
  const group = useRef<THREE.Group>(null);
  const lastCount = useRef(-1);
  const [tex, setTex] = useState<{ lock: Awaited<ReturnType<typeof makeLockScreen>>; dash: THREE.Texture } | null>(null);
  useEffect(() => {
    let alive = true;
    Promise.all([makeLockScreen(), makeDashboard()]).then(([lock, dash]) => alive && setTex({ lock, dash }));
    return () => {
      alive = false;
    };
  }, []);

  const { body, bodyMat, screenGeo, screenMat, buttons } = useMemo(() => {
    const shape = roundedShape(PH.w - PH.bevel * 2, PH.h - PH.bevel * 2, 0.52);
    const body = new THREE.ExtrudeGeometry(shape, { depth: PH.depth, bevelEnabled: true, bevelThickness: PH.bevel, bevelSize: PH.bevel, bevelSegments: 5, curveSegments: 24 });
    body.translate(0, 0, -PH.depth / 2);
    const bodyMat = new THREE.MeshPhysicalMaterial({ color: pal.body, metalness: 0.92, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.2 });
    const screenGeo = new THREE.ShapeGeometry(roundedShape(PH.screenW, PH.screenH, 0.44), 24);
    const p = screenGeo.getAttribute("position");
    const uv = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) uv.set([p.getX(i) / PH.screenW + 0.5, p.getY(i) / PH.screenH + 0.5], i * 2);
    screenGeo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    const screenMat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uLock: { value: null },
        uDash: { value: null },
        uMix: { value: 0 },
        uBright: { value: 0 },
        uPortal: { value: 0 },
        uTime: { value: 0 },
        uRim: { value: col(pal.violet) },
      },
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uLock, uDash; uniform float uMix, uBright, uPortal, uTime; uniform vec3 uRim;
        varying vec2 vUv;
        void main(){
          vec2 q = (vUv - 0.5) * vec2(0.456, 1.0) * 2.;
          float d = length(q);
          float hole = uPortal * 1.35;
          if (uPortal > 0.001 && d < hole) discard;
          vec3 lock = texture2D(uLock, vUv).rgb;
          vec3 dash = texture2D(uDash, vUv).rgb;
          vec3 c = mix(lock, dash, uMix) * uBright;
          // Dark glass when the screen is off, with a diagonal reflection.
          float sheen = smoothstep(0.35, 0.0, abs(vUv.x * 0.6 + vUv.y - 0.95)) * 0.06;
          c += vec3(0.02, 0.018, 0.03) * (1. - uBright) + sheen;
          float ring = exp(-pow((d - hole) * 14., 2.)) * step(0.001, uPortal);
          c += uRim * ring * 2.2;
          gl_FragColor = vec4(c, 1.);
          ${outro}
        }`,
    });
    const buttons = new THREE.MeshPhysicalMaterial({ color: pal.buttons, metalness: 0.9, roughness: 0.3 });
    return { body, bodyMat, screenGeo, screenMat, buttons };
  }, []);

  useEffect(() => {
    if (!tex) return;
    screenMat.uniforms.uLock.value = tex.lock.texture;
    screenMat.uniforms.uDash.value = tex.dash;
  }, [tex, screenMat]);

  const { camera } = useThree();
  useFrame(() => {
    const k = live.k;
    const t = live.time;
    const g = group.current;
    if (!g) return;
    const face = smooth(0.15, 0.95, k);
    const idle = 1 - smooth(0.9, 1.25, k);
    const tilt = smooth(4.65, 4.98, k);
    g.rotation.set(
      0.08 * (1 - face) + finalTilt * tilt + Math.sin(t * 0.6) * 0.02 * idle,
      (-0.55 + Math.sin(t * 0.35) * 0.25) * (1 - face) + Math.sin(t * 0.5) * 0.06 * idle * face + Math.sin(t * 0.4) * 0.05 * tilt,
      0.05 * (1 - face),
    );
    g.position.set(0, Math.sin(t * 0.8) * 0.12 * idle - 0.6 * tilt + Math.sin(t * 0.7) * 0.06 * tilt, 0);
    // Hidden whenever the camera is behind the glass (inside the phone world).
    g.visible = camera.position.z > screenZ - 0.05 || k > 4.9;

    const count = Math.round(smooth(0.55, 1.2, k) * 14);
    if (lastCount.current >= 0 && count > lastCount.current && count - lastCount.current < 4) sfx.notify(count);
    lastCount.current = count;
    tex?.lock.draw(count);
    screenMat.uniforms.uMix.value = k > 2.5 ? 1 : 0;
    screenMat.uniforms.uBright.value = smooth(0.45, 0.58, k) + ramp(0.45, 0.52, 0.55, 0.8, k) * 0.9;
    const dz = camera.position.z - screenZ;
    screenMat.uniforms.uPortal.value = k > 1 && k < 4.9 ? 1 - smooth(0.9, 2.6, dz) : 0;
    screenMat.uniforms.uTime.value = t;
  });

  return (
    <group ref={group}>
      <mesh geometry={body} material={bodyMat} />
      <mesh geometry={screenGeo} material={screenMat} position={[0, 0, screenZ]} />
      {/* Side buttons */}
      <mesh position={[PH.w / 2 + 0.01, 1.4, 0]} material={buttons}>
        <boxGeometry args={[0.06, 1.1, 0.16]} />
      </mesh>
      {[2.1, 1.1].map((y) => (
        <mesh key={y} position={[-PH.w / 2 - 0.01, y, 0]} material={buttons}>
          <boxGeometry args={[0.06, 0.7, 0.16]} />
        </mesh>
      ))}
      {/* Camera bump on the back */}
      <mesh position={[-0.85, 2.75, -PH.depth / 2 - PH.bevel - 0.05]} material={bodyMat}>
        <boxGeometry args={[1.5, 1.5, 0.12]} />
      </mesh>
      <group position={[0, 0, -1]}>
        <Glow glow={glow} color={pal.deep} scale={16} opacity={0.35} />
      </group>
    </group>
  );
}

/** Notification cards that burst out of the screen as it overflows. */
function Burst() {
  const [atlas, setAtlas] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let alive = true;
    makeBrandCardAtlas().then((t) => alive && setAtlas(t));
    return () => {
      alive = false;
    };
  }, []);
  const { geo, mat } = useMemo(() => {
    const n = 44;
    const base = new THREE.PlaneGeometry(1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    geo.setAttribute("position", base.getAttribute("position"));
    geo.setAttribute("uv", base.getAttribute("uv"));
    geo.instanceCount = n;
    const start = new Float32Array(n * 3);
    const dir = new Float32Array(n * 4);
    const axis = new Float32Array(n * 3);
    const misc = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const sx = (Math.random() - 0.5) * 2.8, sy = (Math.random() - 0.5) * 6;
      start.set([sx, sy, 0.3], i * 3);
      const d = new THREE.Vector3(sx * 0.9 + (Math.random() - 0.5) * 2.4, sy * 0.45 + (Math.random() - 0.5) * 2, 0.35 + Math.random() * 0.6).normalize();
      dir.set([d.x, d.y, d.z, 4 + Math.random() * 9], i * 4);
      const ax = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      axis.set([ax.x, ax.y, ax.z], i * 3);
      misc.set([0.62 + (i / n) * 0.7, i % 12, Math.random() * 6.28], i * 3);
    }
    geo.setAttribute("aStart", new THREE.InstancedBufferAttribute(start, 3));
    geo.setAttribute("aDir", new THREE.InstancedBufferAttribute(dir, 4));
    geo.setAttribute("aAxis", new THREE.InstancedBufferAttribute(axis, 3));
    geo.setAttribute("aMisc", new THREE.InstancedBufferAttribute(misc, 3));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      // Cards never hide each other's edges; the phone still hides any card behind it.
      depthWrite: false,
      uniforms: {
        uK: { value: 0 },
        uTime: { value: 0 },
        uMap: { value: null },
        uGrid: { value: new THREE.Vector2(atlasGrid.cols, atlasGrid.rows) },
        uBack: { value: col(isLight() ? "#E6E0D6" : "#2A2723") },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aStart; attribute vec4 aDir; attribute vec3 aAxis; attribute vec3 aMisc;
        uniform float uK, uTime;
        varying vec2 vUv; varying float vTile; varying float vA;
        vec3 rotAxis(vec3 v, vec3 a, float t){ return v*cos(t) + cross(a, v)*sin(t) + a*dot(a, v)*(1. - cos(t)); }
        void main(){
          float q = smoothstep(aMisc.x, aMisc.x + 0.55, uK);
          float out_ = q + max(0., uK - aMisc.x - 0.55) * 0.35;
          vec3 c = aStart + aDir.xyz * aDir.w * out_;
          // Lift off the glass first, then tilt, so a new card never cuts into the screen.
          c.z += 0.15 + q * 0.6;
          c += vec3(sin(uTime*0.5 + aMisc.z), cos(uTime*0.4 + aMisc.z), 0.) * 0.35 * q;
          vec2 corner = position.xy * vec2(2.3, 0.575) * mix(0.35, 1., q);
          float tilt = smoothstep(0.15, 0.7, q) * (aMisc.z - 3.) * (0.3 + 0.06 * sin(uTime * 0.6 + aMisc.z * 4.));
          vec3 off = rotAxis(vec3(corner, 0.), aAxis, tilt);
          vec4 mv = modelViewMatrix * vec4(c + off, 1.);
          gl_Position = projectionMatrix * mv;
          vUv = uv; vTile = aMisc.y;
          // Fade a card as it turns side-on, where squashed text would read as noise.
          vec3 nv = normalize((modelViewMatrix * vec4(rotAxis(vec3(0., 0., 1.), aAxis, tilt), 0.)).xyz);
          float facing = abs(dot(nv, normalize(-mv.xyz)));
          vA = smoothstep(aMisc.x, aMisc.x + 0.06, uK) * (1. - smoothstep(1.85, 2.05, uK)) * smoothstep(2.5, 5., -mv.z) * smoothstep(0.3, 0.6, facing);
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap; uniform vec2 uGrid; uniform vec3 uBack; varying vec2 vUv; varying float vTile; varying float vA;
        void main(){
          vec2 uv = vUv;
          vec3 rgb;
          float tile = floor(vTile + 0.5); float c = mod(tile, uGrid.x); float r = floor(tile / uGrid.x);
          vec4 t = texture2D(uMap, vec2((c + uv.x) / uGrid.x, 1. - (r + 1. - uv.y) / uGrid.y));
          rgb = gl_FrontFacing ? t.rgb : uBack;
          float a = t.a * vA;
          if (a < 0.04) discard;
          gl_FragColor = vec4(rgb, a);
          ${outro}
        }`,
    });
    return { geo, mat };
  }, []);
  useEffect(() => {
    if (atlas) mat.uniforms.uMap.value = atlas;
  }, [atlas, mat]);
  useFrame(() => {
    mat.uniforms.uK.value = live.k;
    mat.uniforms.uTime.value = live.time;
  });
  if (!atlas) return null;
  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={1} />;
}

/* ------------------------------------------------------------------------------------------------
 * Act II: the slot machine
 * ---------------------------------------------------------------------------------------------- */

const REEL = { r: 3.6, len: 3.2, gap: 3.45, cells: 12 };
const cellA = (Math.PI * 2) / REEL.cells;
const cellArc = REEL.r * cellA;
const reelZ = C.z + 0.3 - REEL.r;
/** Each reel lands Orbit on the payline; the apps either side of it break out into the network. */
const stopCell = [0, 3, 6, 9, 2];
/** Act positions where each reel stops. The last one holds on for suspense. */
const SPIN_FROM = 2.04;
const stopAt = [2.2, 2.25, 2.3, 2.35, 2.47];
const JACKPOT = 2.49;
/** Seconds after a manual pull when each reel lands; the last one holds for suspense. */
const manualStop = [1.25, 1.55, 1.85, 2.15, 2.95];
const idleCell = stopCell.map((c, i) => (c + 3 + i) % 12);

/**
 * The machine can be played two ways: pull the lever (time-driven) or keep scrolling
 * (scroll-driven). Either way it lands on the jackpot, and wonAt marks the moment.
 */
export const slot = { pulledAt: -1, wonAt: -1 };
const leverReady = (k: number) => k > 1.86 && k < SPIN_FROM && slot.pulledAt < 0 && slot.wonAt < 0;
function pullLever() {
  if (live.k < 1.7 || live.k >= JACKPOT || slot.pulledAt >= 0 || slot.wonAt >= 0) return;
  slot.pulledAt = live.time;
  sfx.lever();
}

const reelOrders = stopCell.map((c, r) => {
  const order = new Array<number>(REEL.cells).fill(-1);
  order[c] = ORBIT;
  order[(c + 1) % REEL.cells] = aboveApps[r];
  order[(c + REEL.cells - 1) % REEL.cells] = belowApps[r];
  // A second Orbit on the far side flashes past while the reels spin.
  order[(c + 6) % REEL.cells] = ORBIT;
  const pool = brands.map((_, i) => i).filter((i) => i !== ORBIT && !networkApps.includes(i));
  const fill = [...pool.slice(r * 4), ...pool.slice(0, r * 4)];
  let n = 0;
  for (let i = 0; i < REEL.cells; i++) if (order[i] < 0) order[i] = fill[n++ % fill.length];
  return order;
});

function reelMaterial(order: number[]) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: null },
      uAngle: { value: 0 },
      uBlur: { value: 0 },
      uOrder: { value: order },
      uWin: { value: 0 },
      uGrid: { value: new THREE.Vector2(brandGrid.cols, brandGrid.rows) },
      uGold: { value: col(pal.gold) },
      uRose: { value: col(pal.rose) },
      uBgA: { value: new THREE.Vector3(...pal.reelA) },
      uBgB: { value: new THREE.Vector3(...pal.reelB) },
      uSep: { value: pal.reelSep },
    },
    vertexShader: /* glsl */ `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap; uniform float uAngle, uBlur, uOrder[${REEL.cells}], uWin; uniform vec2 uGrid; uniform vec3 uGold, uRose, uBgA, uBgB; uniform float uSep;
      varying vec3 vP;
      const float N = ${REEL.cells.toFixed(1)};
      const float CA = 6.2831853 / N;
      vec4 icon(float ang, float lx){
        float a = ang / CA + 0.5;
        float cell = mod(floor(a), N);
        float ly = fract(a);
        int ci = int(cell + 0.5);
        float id = uOrder[ci];
        vec2 inset = (vec2(lx, ly) - 0.5) * 1.12 + 0.5;
        if (inset.x < 0. || inset.x > 1. || inset.y < 0. || inset.y > 1.) return vec4(0.);
        float c = mod(id, uGrid.x); float r = floor(id / uGrid.x);
        vec4 t = texture2D(uMap, vec2((c + inset.x) / uGrid.x, 1. - (r + 1. - inset.y) / uGrid.y));
        return t;
      }
      void main(){
        float ang = atan(vP.y, vP.z) + uAngle;
        // Square icons: local x in units of one cell's arc length.
        float lx = vP.x / ${cellArc.toFixed(3)} + 0.5;
        vec4 acc = vec4(0.);
        for (int i = 0; i < 7; i++) acc += icon(ang + (float(i) - 3.) * uBlur * 0.045, lx);
        acc /= 7.;
        float rx = vP.x / ${REEL.len.toFixed(2)} + 0.5;
        vec3 bg = mix(uBgA, uBgB, smoothstep(0.1, 0.9, rx));
        // Faint separators between cells.
        float cf = fract(ang / CA + 0.5);
        float sep = smoothstep(0.03, 0., cf) + smoothstep(0.97, 1., cf);
        bg += vec3(uSep) * sep * (1. - uBlur);
        vec3 c = mix(bg, acc.rgb, acc.a);
        float facing = max(vP.z / ${REEL.r.toFixed(2)}, 0.);
        c *= 0.18 + 0.97 * pow(facing, 1.7);
        // The winning line glows gold.
        float onLine = exp(-pow(vP.y * 0.9, 2.)) * facing;
        c = mix(c, c * 1.35 + uGold * 0.12, onLine * uWin);
        float edge = smoothstep(0.015, 0., rx) + smoothstep(0.985, 1., rx);
        c += uRose * edge * 0.3;
        gl_FragColor = vec4(c, 1.);
        ${outro}
      }`,
  });
}

function neonTube(w: number, h: number, r: number, y: number, z: number, radius: number) {
  const s = roundedShape(w, h, r);
  const pts = s.getSpacedPoints(160).map((p) => new THREE.Vector3(p.x, p.y + y, z));
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 320, radius, 8, true);
}

function Machine({ glow }: { glow: THREE.Texture }) {
  const group = useRef<THREE.Group>(null);
  const lever = useRef<THREE.Group>(null);
  const marqueeMat = useRef<THREE.MeshBasicMaterial>(null);
  const [atlas, setAtlas] = useState<THREE.Texture | null>(null);
  const marquees = useMemo(
    () => [makeMarquee("TOO MANY APPS", 0), makeMarquee("TOO MANY APPS", 1), makeMarquee("JACKPOT", 0, true), makeMarquee("JACKPOT", 1, true)],
    [],
  );
  useEffect(() => {
    let alive = true;
    getBrandAtlas().then((t) => alive && setAtlas(t));
    return () => {
      alive = false;
    };
  }, []);

  const parts = useMemo(() => {
    const outer = roundedShape(21, 12, 1.4);
    const holePath = new THREE.Path(roundedShape(17.8, 6.6, 0.55).getPoints(24).map((p) => new THREE.Vector2(p.x, p.y - 0.6)));
    outer.holes.push(holePath);
    const frame = new THREE.ExtrudeGeometry(outer, { depth: 1.2, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.14, bevelSegments: 4, curveSegments: 24 });
    frame.translate(0, 0, -0.6);
    const frameMat = new THREE.MeshPhysicalMaterial({ color: pal.frame, metalness: pal.frameMetal, roughness: 0.32, clearcoat: 0.8 });
    const neonA = neonTube(17.95, 6.75, 0.6, -0.6, 0.78, 0.07);
    const neonB = neonTube(21.2, 12.2, 1.5, 0, 0.1, 0.06);
    const neonMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(pal.rose).multiplyScalar(isLight() ? 1 : 1.6), toneMapped: false });
    const neonMatB = new THREE.MeshBasicMaterial({ color: new THREE.Color(pal.violet).multiplyScalar(isLight() ? 1 : 1.4), toneMapped: false });
    const haloMat = ink(new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uC: { value: col(pal.rose) }, uI: { value: 1 } },
      vertexShader: /* glsl */ `varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: /* glsl */ `uniform vec3 uC; uniform float uI; varying vec3 vN; void main(){ float i = pow(abs(vN.z), 2.); gl_FragColor = vec4(uC*i*0.35*uI, 1.); ${outro} }`,
    }), 1.6, 0.2);
    const haloA = neonTube(17.95, 6.75, 0.6, -0.6, 0.78, 0.4);
    // Gold frame that lights up around the winning line.
    const winTube = neonTube(17.3, cellArc * 1.08, 0.35, -0.6, 0.62, 0.06);
    const winMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(pal.gold).multiplyScalar(isLight() ? 1 : 1.8), toneMapped: false, transparent: true, opacity: 0 });
    const winHalo = neonTube(17.3, cellArc * 1.08, 0.35, -0.6, 0.62, 0.34);
    const winHaloMat = haloMat.clone();
    winHaloMat.uniforms.uC.value = col(pal.goldHot);
    const reelGeo = new THREE.CylinderGeometry(REEL.r, REEL.r, REEL.len, 128, 1, true);
    reelGeo.rotateZ(Math.PI / 2);
    const mats = reelOrders.map(reelMaterial);
    return { frame, frameMat, neonA, neonB, neonMat, neonMatB, haloMat, haloA, winTube, winMat, winHalo, winHaloMat, reelGeo, mats };
  }, []);

  useEffect(() => {
    if (atlas) parts.mats.forEach((m) => (m.uniforms.uMap.value = atlas));
  }, [atlas, parts]);

  const reels = useRef(idleCell.map((c) => ({ angle: c * cellA, v: 0, aim: null as number | null, target: c, spinning: false })));
  const tick = useRef(0);
  const knob = useRef<THREE.MeshPhysicalMaterial>(null);
  const hovering = useRef(false);
  const { camera } = useThree();

  useEffect(() => {
    const onPull = () => pullLever();
    window.addEventListener("story:pull", onPull);
    return () => {
      window.removeEventListener("story:pull", onPull);
      document.body.style.cursor = "";
      slot.pulledAt = slot.wonAt = -1;
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const k = live.k;
    const now = live.time;
    const g = group.current;
    if (!g) return;
    // Only once the camera is through the glass, so it never shows around the phone.
    const through = smooth(2.2, 0.6, camera.position.z) * (k > 1 ? 1 : 0);
    const collapse = smooth(2.68, 2.9, k);
    const vis = through * (1 - collapse);
    g.visible = vis > 0.001;
    g.scale.setScalar(Math.max(0.001, live.inner * (0.55 + 0.45 * through) * (1 - collapse * 0.95)));
    g.rotation.y = collapse * 0.9;

    // Scrolling back above the machine resets it so it can be played again.
    if (k < 1.8) slot.pulledAt = slot.wonAt = -1;
    const manual = slot.pulledAt >= 0;
    const since = now - slot.pulledAt;
    if (!manual && crossed(2.01)) sfx.lever();

    let anySpin = 0;
    reels.current.forEach((r, i) => {
      const spinning = manual ? since > 0.22 && since < manualStop[i] : k > SPIN_FROM && k < stopAt[i];
      const settled = manual ? since >= manualStop[i] : k >= stopAt[i];
      if (spinning) {
        // The last reel slows right down before it lands.
        const slow = i === 4 ? 1 - (manual ? smooth(manualStop[3], manualStop[4], since) : smooth(stopAt[3], stopAt[4], k)) * 0.8 : 1;
        const spinUp = manual ? smooth(0.22, 0.6, since) : 1;
        r.v = (9 + i * 0.7) * slow * spinUp;
        r.angle += r.v * dt;
        r.aim = null;
        anySpin = Math.max(anySpin, r.v);
      } else {
        const target = settled ? stopCell[i] : idleCell[i];
        if (r.aim === null || r.target !== target) {
          r.target = target;
          r.aim = target * cellA + Math.ceil((r.angle - target * cellA) / (Math.PI * 2) + 0.02) * Math.PI * 2;
          if (r.spinning && settled) sfx.clunk(i === 4);
        }
        // A damped spring, so each reel lands with a small bounce.
        r.v += ((r.aim - r.angle) * 90 - r.v * 11) * dt;
        r.angle += r.v * dt;
      }
      r.spinning = spinning;
    });

    // The jackpot: after the last reel of a manual pull, or when scrolling past it.
    if (slot.wonAt < 0 && ((manual && since >= manualStop[4] + 0.12) || (!manual && crossed(JACKPOT)))) {
      slot.wonAt = now;
      sfx.jackpot();
    }
    if (!manual && k < JACKPOT - 0.02) slot.wonAt = -1;
    const won = slot.wonAt >= 0;
    const win = won ? smooth(0, 0.15, now - slot.wonAt) * (0.7 + 0.3 * Math.sin(now * 22)) * (1 - smooth(2.62, 2.72, k)) : 0;
    reels.current.forEach((_, i) => {
      const m = parts.mats[i];
      m.uniforms.uAngle.value = reels.current[i].angle;
      m.uniforms.uBlur.value = Math.min(1, Math.abs(reels.current[i].v) / 9);
      m.uniforms.uWin.value = won ? Math.max(0.35, win) * (1 - collapse) : 0;
    });

    // Reel ticks while spinning.
    if (anySpin > 0 && through > 0.5) {
      tick.current += dt * anySpin;
      if (tick.current > 0.55) {
        tick.current = 0;
        sfx.tick();
      }
    }

    const phase = Math.floor(now * (won ? 9 : 3)) % 2;
    if (marqueeMat.current) marqueeMat.current.map = marquees[(won ? 2 : 0) + phase];
    parts.haloMat.uniforms.uI.value = 0.8 + win * 1.5 + Math.sin(now * 3) * 0.1;
    parts.winMat.opacity = win;
    parts.winHaloMat.uniforms.uI.value = win * 2.2;

    // The lever: pulled by hand (time) or by scrolling past it.
    const pullHand = manual ? (since < 0.18 ? since / 0.18 : since < 0.35 ? 1 : Math.max(0, 1 - (since - 0.35) / 0.45)) : 0;
    const pullScroll = manual ? 0 : ramp(2.0, 2.05, 2.07, 2.16, k);
    if (lever.current) lever.current.rotation.x = Math.max(pullHand, pullScroll) * 1.1;
    const ready = leverReady(k) && through > 0.9;
    if (knob.current) knob.current.emissiveIntensity = 0.5 + (ready ? 0.9 + Math.sin(now * 6) * 0.6 : 0) + (hovering.current && ready ? 0.8 : 0);
    const hint = document.getElementById("lever-hint");
    if (hint) {
      hint.style.opacity = ready ? "1" : "0";
      hint.style.pointerEvents = ready ? "auto" : "none";
    }
    if (!ready && hovering.current) document.body.style.cursor = "";
  });

  return (
    <group position={C}>
      <group ref={group}>
        <Glow glow={glow} color={pal.deep} scale={46} opacity={0.3} />
        <Glow glow={glow} color={pal.rose} scale={26} opacity={0.2} />
        <mesh geometry={parts.frame} material={parts.frameMat} />
        <mesh geometry={parts.neonA} material={parts.neonMat} />
        <mesh geometry={parts.haloA} material={parts.haloMat} />
        <mesh geometry={parts.neonB} material={parts.neonMatB} />
        <mesh geometry={parts.winTube} material={parts.winMat} />
        <mesh geometry={parts.winHalo} material={parts.winHaloMat} />
        {/* Backplate behind the reels */}
        <mesh position={[0, -0.6, -REEL.r * 2 + 0.2]}>
          <planeGeometry args={[19, 8]} />
          <meshBasicMaterial color={pal.backplate} />
        </mesh>
        {atlas &&
          parts.mats.map((m, i) => (
            <mesh key={i} geometry={parts.reelGeo} material={m} position={[(i - 2) * REEL.gap, -0.6, reelZ - C.z]} />
          ))}
        {/* Payline arrows */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 9.25, -0.6, 0.7]} rotation={[0, 0, side > 0 ? Math.PI / 2 : -Math.PI / 2]}>
            <circleGeometry args={[0.32, 3]} />
            <meshBasicMaterial color={new THREE.Color(pal.gold).multiplyScalar(isLight() ? 1 : 1.5)} toneMapped={false} />
          </mesh>
        ))}
        {/* Marquee */}
        <mesh position={[0, 4.15, 0.78]}>
          <planeGeometry args={[11, 1.89]} />
          <meshBasicMaterial ref={marqueeMat} map={marquees[0]} toneMapped={false} />
        </mesh>
        {/* Lever */}
        <group position={[11.4, -1.6, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.55, 0.55, 0.8, 32]} />
            <primitive object={parts.frameMat} attach="material" />
          </mesh>
          <group
            ref={lever}
            onPointerDown={(e) => {
              e.stopPropagation();
              pullLever();
            }}
            onPointerOver={() => {
              hovering.current = true;
              if (leverReady(live.k)) document.body.style.cursor = "grab";
            }}
            onPointerOut={() => {
              hovering.current = false;
              document.body.style.cursor = "";
            }}
          >
            <mesh position={[0.3, 2.4, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 4.8, 16]} />
              <meshPhysicalMaterial color={pal.lever} metalness={1} roughness={0.2} />
            </mesh>
            <mesh position={[0.3, 4.9, 0]}>
              <sphereGeometry args={[0.62, 32, 24]} />
              <meshPhysicalMaterial ref={knob} color={pal.rose} emissive={pal.rose} emissiveIntensity={0.5} roughness={0.15} clearcoat={1} />
            </mesh>
            {/* A larger invisible target so the lever is easy to hit, even on a phone. */}
            <mesh position={[0.3, 3.6, 0]} visible={false}>
              <boxGeometry args={[2.6, 4.2, 2.6]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

/** Ding ding ding: sparks and spinning Orbit coins burst out of the machine on the jackpot. */
function Jackpot({ glow }: { glow: THREE.Texture }) {
  const [atlas, setAtlas] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let alive = true;
    getBrandAtlas().then((t) => alive && setAtlas(t));
    return () => {
      alive = false;
    };
  }, []);
  const coinRefs = useRef<(THREE.Sprite | null)[]>([]);
  const flash = useRef<THREE.Sprite>(null);
  const COINS = 26;
  const { geo, mat, coins } = useMemo(() => {
    const n = 700;
    const pos = new Float32Array(n * 3);
    const vel = new Float32Array(n * 3);
    const misc = new Float32Array(n * 3);
    const front = reelZ - C.z + REEL.r + 0.4;
    for (let i = 0; i < n; i++) {
      pos.set([(Math.floor(Math.random() * 5) - 2) * REEL.gap + (Math.random() - 0.5) * 2, -0.6 + (Math.random() - 0.5) * 1.4, front], i * 3);
      vel.set([(Math.random() - 0.5) * 14, 3 + Math.random() * 12, 2 + Math.random() * 12], i * 3);
      misc.set([Math.random() * 3, 1.5 + Math.random() * 3.5, Math.random() * 6.28], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aVel", new THREE.BufferAttribute(vel, 3));
    geo.setAttribute("aMisc", new THREE.BufferAttribute(misc, 3));
    const mat = ink(new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: -1 }, uPR: { value: 1 }, uTime: { value: 0 }, uGold: { value: col(pal.gold) }, uRose: { value: col(pal.rose) }, uWhite: { value: col(pal.spark) } },
      vertexShader: /* glsl */ `
        attribute vec3 aVel; attribute vec3 aMisc; uniform float uT, uPR, uTime;
        varying float vA; varying float vKind;
        void main(){
          float t = max(uT, 0.);
          vec3 p = position + aVel * t * 0.9 + vec3(0., -7., 0.) * t * t;
          vec4 mv = modelViewMatrix * vec4(p, 1.);
          gl_Position = projectionMatrix * mv;
          vA = step(0., uT) * (1. - smoothstep(0.6, 2.2, t)) * (0.6 + 0.4 * sin(uTime * 20. + aMisc.z));
          vKind = aMisc.x;
          gl_PointSize = aMisc.y * uPR * clamp(40. / -mv.z, 0.6, 3.);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uGold, uRose, uWhite; varying float vA; varying float vKind;
        void main(){
          vec2 q = gl_PointCoord - 0.5;
          float star = max(smoothstep(0.5, 0., length(q)) , 0.) * (0.4 + 0.6 * smoothstep(0.08, 0., min(abs(q.x), abs(q.y))));
          vec3 c = vKind < 1. ? uGold : vKind < 2. ? uRose : uWhite;
          gl_FragColor = vec4(c * star * vA * 1.4, 1.);
          ${outro}
        }`,
    }), 2, 0.25);
    const coins = Array.from({ length: COINS }, () => ({
      o: V((Math.floor(Math.random() * 5) - 2) * REEL.gap, -0.6, reelZ - C.z + REEL.r + 0.6),
      v: V((Math.random() - 0.5) * 12, 5 + Math.random() * 9, 6 + Math.random() * 10),
      spin: (Math.random() - 0.5) * 10,
      delay: Math.random() * 0.35,
    }));
    return { geo, mat, coins };
  }, []);
  const coinMats = useMemo(() => {
    if (!atlas) return [];
    const t = atlas.clone();
    t.repeat.set(1 / brandGrid.cols, 1 / brandGrid.rows);
    t.offset.set(0, 1 - 1 / brandGrid.rows);
    t.needsUpdate = true;
    return coins.map(() => new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  }, [atlas, coins]);

  const { gl } = useThree();
  const group = useRef<THREE.Group>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const t = slot.wonAt < 0 ? -1 : live.time - slot.wonAt;
    live.shake = t >= 0 ? Math.max(0, 1 - t / 0.6) : 0;
    mat.uniforms.uT.value = t;
    mat.uniforms.uPR.value = gl.getPixelRatio();
    mat.uniforms.uTime.value = live.time;
    if (group.current) {
      group.current.scale.setScalar(live.inner);
      group.current.visible = t >= 0 && t < 3;
    }
    if (flash.current) {
      const f = t >= 0 ? Math.exp(-t * 4) : 0;
      flash.current.material.opacity = f * (isLight() ? 0.45 : 0.9);
      flash.current.scale.setScalar(10 + (1 - f) * 30);
    }
    coinRefs.current.forEach((sp, i) => {
      if (!sp) return;
      const c = coins[i];
      const tt = Math.max(0, t - c.delay);
      tmp.copy(c.o).addScaledVector(c.v, tt * 0.9);
      tmp.y -= 7 * tt * tt;
      sp.position.copy(tmp);
      sp.material.rotation = tt * c.spin;
      sp.material.opacity = t >= c.delay ? 1 - smooth(1.4, 2.4, tt) : 0;
      sp.scale.setScalar(1.1 + Math.sin(tt * 8 + i) * 0.08);
    });
  });

  return (
    <group position={C}>
      <group ref={group} visible={false}>
        <points geometry={geo} material={mat} frustumCulled={false} />
        {coinMats.map((m, i) => (
          <sprite key={i} ref={(el) => void (coinRefs.current[i] = el)} material={m} />
        ))}
        <sprite ref={flash} position={[0, -0.6, 2]}>
          <spriteMaterial map={glow} color={pal.flash} transparent opacity={0} blending={glowBlend()} depthWrite={false} />
        </sprite>
      </group>
    </group>
  );
}


/* ------------------------------------------------------------------------------------------------
 * Act III: the network and the sphere
 * ---------------------------------------------------------------------------------------------- */

const R_SPHERE = 5;

/** Where each app sits on the reels when they stop (relative to C, before scaling). */
const rowPos = (reel: number, row: -1 | 0 | 1) =>
  V((reel - 2) * REEL.gap, -0.6 + row * REEL.r * Math.sin(cellA), reelZ - C.z + REEL.r * Math.cos(row * cellA) + 0.1);
const nodeStart = [...aboveApps.map((_, i) => rowPos(i, 1)), ...belowApps.map((_, i) => rowPos(i, -1))];
const nodeApps = networkApps;
/** The five winning Orbit icons, which fly into the centre and become the sphere. */
const tokenStart = stopCell.map((_, i) => rowPos(i, 0));
/** A ring around the sphere that opens on the right, where the copy sits. */
const nodeTarget = nodeApps.map((_, i) => {
  const a = (Math.PI / 3) + (i / (nodeApps.length - 1)) * (Math.PI * 4) / 3;
  return V(Math.cos(a) * 8, Math.sin(a) * 6.2, Math.sin(a * 2) * 2.5 + 1);
});
/** The phone's screen centre and facing direction in its final, tilted pose. */
const finalNormal = V(0, 0, 1).applyAxisAngle(V(1, 0, 0), finalTilt);
const finalScreen = V(0, 0, screenZ).applyAxisAngle(V(1, 0, 0), finalTilt).add(V(0, -0.6, 0));
const holoCenter = finalScreen.clone().addScaledVector(finalNormal, 5.6);

function Sphere({ glow }: { glow: THREE.Texture }) {
  const mesh = useRef<THREE.Mesh>(null);
  const glows = useRef<THREE.Group>(null);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uOpen: { value: 0 },
          uVis: { value: 0 },
          uCam: { value: new THREE.Vector3(0, 0, 1) },
          uA: { value: col(pal.blue) },
          uB: { value: col(pal.violet) },
          uIce: { value: col(pal.ice) },
          uRose: { value: col(pal.heather) },
          uLight: { value: isLight() ? 1 : 0 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vObj; varying vec3 vN; varying vec3 vW;
          void main(){ vObj = position; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*viewMatrix*w; }`,
        fragmentShader: /* glsl */ `
          uniform float uTime, uOpen, uVis, uLight; uniform vec3 uCam, uA, uB, uIce, uRose;
          varying vec3 vObj; varying vec3 vN; varying vec3 vW;
          ${noise}
          void main(){
            vec3 n = normalize(vObj);
            // Lens aperture facing the camera: seven blades turning as they open.
            vec3 t1 = normalize(cross(abs(uCam.y) < 0.9 ? vec3(0.,1.,0.) : vec3(1.,0.,0.), uCam));
            vec3 t2 = cross(uCam, t1);
            vec2 p = vec2(dot(n, t1), dot(n, t2));
            float facing = dot(n, uCam);
            float ang = atan(p.y, p.x) + uOpen * 1.6;
            float seg = 6.2831853 / 7.;
            float poly = cos(seg * 0.5) / cos(mod(ang, seg) - seg * 0.5);
            float rad = length(p);
            float aperture = uOpen * 1.08 * poly;
            float inHole = step(0., facing) * step(rad, aperture);
            if (uOpen > 0.001 && inHole > 0.5) discard;
            float rimD = abs(rad - aperture) * step(0., facing);
            float rim = exp(-rimD * rimD * 900.) * step(0.001, uOpen);
            float blade = step(0., facing) * smoothstep(0.03, 0., abs(fract((ang / seg) + rad * 1.2) - 0.5) - 0.47) * smoothstep(aperture + 0.5, aperture, rad) * uOpen;

            vec3 V = normalize(cameraPosition - vW);
            float fres = pow(1. - abs(dot(normalize(vN), V)), 2.2);
            float f = fbm(n * 2.2 + vec3(uTime * 0.08, -uTime * 0.05, 0.));
            vec2 g = vec2(atan(n.z, n.x) / 6.2831853 * 36., asin(n.y) / 3.14159 * 18.);
            vec2 fw = fwidth(g);
            vec2 l = abs(fract(g - 0.5) - 0.5) / fw;
            float grid = 1. - min(min(l.x, l.y), 1.);
            vec3 c;
            if (gl_FrontFacing) {
              c = mix(uA, uB, smoothstep(-0.4, 0.6, f)) * (0.45 + 0.4 * f);
              c += uIce * fres * 1.3 + uIce * grid * 0.12;
              c += uIce * rim * 2.5 + uB * blade * 0.6;
            } else {
              // The inside: a dark chamber traced with light.
              c = uA * 0.04 + uB * grid * 0.16 + uRose * grid * 0.06 * sin(n.y * 8. + uTime);
              // In daylight the chamber is pale paper ruled in petrol, so the ink hologram reads on it.
              c = mix(c, vec3(0.86, 0.84, 0.8) - vec3(0.5, 0.25, 0.28) * grid * 0.5, uLight);
            }
            float a = gl_FrontFacing ? mix(0.95, 0.9, fres) : 0.9;
            gl_FragColor = vec4(c * uVis, a * uVis);
            ${outro}
          }`,
      }),
    [],
  );
  const { camera } = useThree();
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const k = live.k;
    const grow = smooth(2.7, 2.95, k);
    const lens = smooth(3.5, 3.95, k);
    const vis = grow * (1 - smooth(4.2, 4.45, k));
    const s = Math.max(0.001, R_SPHERE * live.inner * grow * (1 + lens * 1.45));
    if (mesh.current) {
      mesh.current.scale.setScalar(s);
      mesh.current.visible = vis > 0.001;
    }
    if (glows.current) {
      glows.current.scale.setScalar(Math.max(0.001, live.inner * grow * (1 - lens * 0.7)));
      glows.current.visible = vis > 0.001;
    }
    mat.uniforms.uTime.value = live.time;
    mat.uniforms.uOpen.value = smooth(3.5, 3.9, k);
    mat.uniforms.uVis.value = vis;
    tmp.copy(camera.position).sub(C).normalize();
    mat.uniforms.uCam.value.copy(tmp);
  });
  return (
    <group position={C}>
      <group ref={glows}>
        <Glow glow={glow} color={pal.blue} scale={26} opacity={0.55} />
        <Glow glow={glow} color={pal.ice} scale={9} opacity={0.4} />
      </group>
      <mesh ref={mesh} renderOrder={2}>
        <sphereGeometry args={[1, 96, 64]} />
        <primitive object={mat} attach="material" />
      </mesh>
    </group>
  );
}

function Network({ glow }: { glow: THREE.Texture }) {
  const [atlas, setAtlas] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let alive = true;
    getBrandAtlas().then((t) => alive && setAtlas(t));
    return () => {
      alive = false;
    };
  }, []);
  const sprites = useRef<(THREE.Group | null)[]>([]);
  const tokens = useRef<(THREE.Sprite | null)[]>([]);
  const lines = useRef<THREE.LineSegments>(null);
  const { icons, tokenMat } = useMemo(() => {
    if (!atlas) return { icons: [], tokenMat: null };
    const tile = (a: number) => {
      const t = atlas.clone();
      t.repeat.set(1 / brandGrid.cols, 1 / brandGrid.rows);
      t.offset.set((a % brandGrid.cols) / brandGrid.cols, 1 - (Math.floor(a / brandGrid.cols) + 1) / brandGrid.rows);
      t.needsUpdate = true;
      return new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false });
    };
    return { icons: nodeApps.map(tile), tokenMat: tile(ORBIT) };
  }, [atlas]);

  const { geo, mat } = useMemo(() => {
    const pos: number[] = [];
    const tt: number[] = [];
    const id: number[] = [];
    const p = new THREE.Vector3();
    nodeTarget.forEach((n, i) => {
      const end = n.clone().normalize().multiplyScalar(R_SPHERE + 0.1);
      const ctrl = n.clone().add(end).multiplyScalar(0.5).add(V(0, 2.5, 0));
      const cv = new THREE.QuadraticBezierCurve3(n, ctrl, end);
      for (let s = 0; s < 48; s++) {
        for (const e of [s, s + 1]) {
          cv.getPoint(e / 48, p);
          pos.push(p.x, p.y, p.z);
          tt.push(e / 48);
          id.push(i);
        }
      }
      const m = nodeTarget[(i + 3) % nodeTarget.length];
      for (let s = 0; s < 20; s++) {
        for (const e of [s, s + 1]) {
          p.lerpVectors(n, m, e / 20);
          pos.push(p.x, p.y, p.z);
          tt.push(-1);
          id.push(i);
        }
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("aT", new THREE.Float32BufferAttribute(tt, 1));
    geo.setAttribute("aI", new THREE.Float32BufferAttribute(id, 1));
    const mat = ink(new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uVis: { value: 0 }, uA: { value: col(pal.violet) }, uB: { value: col(isLight() ? pal.heather : pal.ice) } },
      vertexShader: /* glsl */ `attribute float aT; attribute float aI; varying float vT; varying float vI; void main(){ vT = aT; vI = aI; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: /* glsl */ `
        uniform float uTime, uReveal, uVis; uniform vec3 uA, uB; varying float vT; varying float vI;
        void main(){
          vec3 c;
          if (vT < 0.) c = uA * 0.28 * smoothstep(0.8, 1., uReveal);
          else {
            float shown = step(vT, uReveal * 1.3 - vI * 0.03);
            float pulse = exp(-pow((vT - fract(uTime * 0.4 + vI * 0.17)) * 14., 2.));
            c = mix(uA, uB, pulse) * (0.35 + pulse * 2.4) * shown;
          }
          gl_FragColor = vec4(c * uVis, 1.);
          ${outro}
        }`,
    }), 3, 0.18);
    return { geo, mat };
  }, []);

  const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), orbit: new THREE.Vector3(), axis: new THREE.Vector3(1, 0, 0) }), []);
  const { camera, size } = useThree();
  useFrame(() => {
    const k = live.k;
    const inner = live.inner;
    mat.uniforms.uTime.value = live.time;
    mat.uniforms.uReveal.value = smooth(2.85, 3.2, k);
    mat.uniforms.uVis.value = smooth(2.85, 2.95, k) * (1 - smooth(4.15, 4.4, k)) * (1 - smooth(3.55, 3.9, k) * 0.6);
    if (lines.current) lines.current.scale.setScalar(inner);

    sprites.current.forEach((g, i) => {
      if (!g) return;
      const fly = smooth(2.6 + i * 0.02, 2.9 + i * 0.02, k);
      const leave = smooth(4.15, 4.42, k);
      const back = smooth(4.72 + i * 0.012, 4.95 + i * 0.012, k);
      // Reels -> network (arcing forward) -> back into the sphere.
      tmp.a.copy(nodeStart[i]).lerp(nodeTarget[i], fly);
      tmp.a.z += Math.sin(fly * Math.PI) * 4;
      tmp.a.multiplyScalar(inner * (1 - leave)).add(C);
      let scale = (1.95 - fly * 0.45) * inner * (1 - leave);
      let vis = k > 2.58 && k < 4.45;
      // Finale: orbit the hologram above the phone.
      if (k > 4.7) {
        const ang = (i / nodeApps.length) * Math.PI * 2 + live.time * 0.35;
        tmp.orbit.set(Math.cos(ang) * 2.7, Math.sin(ang * 2 + i) * 0.25, Math.sin(ang) * 2.7);
        rotAxis(tmp.orbit, tmp.axis, 0.35).add(holoCenter);
        tmp.a.copy(tmp.orbit);
        scale = 0.62 * back * (1 - ramp(5.3, 5.8, 9.2, 9.7, k) * 0.9);
        vis = back > 0.01;
      }
      g.position.copy(tmp.a);
      g.scale.setScalar(Math.max(0.001, scale));
      g.visible = vis;
    });

    // The winning Orbit icons pull into the centre, where the sphere is born.
    tokens.current.forEach((sp, j) => {
      if (!sp) return;
      const q = smooth(2.55 + j * 0.02, 2.82 + j * 0.02, k);
      tmp.a.copy(tokenStart[j]).multiplyScalar(1 - q);
      tmp.a.z += Math.sin(q * Math.PI) * 3;
      sp.position.copy(tmp.a.multiplyScalar(inner).add(C));
      sp.scale.setScalar(Math.max(0.001, 1.95 * inner * (1 - q * 0.8)));
      sp.material.rotation = q * Math.PI * 2 * (j % 2 ? 1 : -1);
      sp.visible = k > 2.55 && q < 0.995;
    });

    // Labels for the network (desktop only; they avoid the copy column).
    const on = ramp(2.92, 3.02, 3.45, 3.6, k);
    story.labels.forEach((el, i) => {
      if (!el) return;
      tmp.b.copy(nodeTarget[i]).multiplyScalar(inner).add(C).project(camera);
      const x = (tmp.b.x * 0.5 + 0.5) * size.width;
      const y = (-tmp.b.y * 0.5 + 0.5) * size.height;
      const side = 1 - smooth(0.5, 0.56, x / size.width);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, 0) translateY(34px)`;
      el.style.opacity = (on * side * (tmp.b.z < 1 ? 1 : 0)).toFixed(3);
    });
  });

  return (
    <>
      <lineSegments ref={lines} geometry={geo} material={mat} position={C} frustumCulled={false} />
      {tokenMat &&
        tokenStart.map((_, j) => <sprite key={`t${j}`} ref={(el) => void (tokens.current[j] = el)} material={tokenMat.clone()} visible={false} />)}
      {icons.map((m, i) => (
        <group key={i} ref={(el) => void (sprites.current[i] = el)} visible={false}>
          <Glow glow={glow} color={pal.violet} scale={2.2} opacity={0.45} />
          <sprite material={m} />
        </group>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Act IV: the Orbit hologram
 * ---------------------------------------------------------------------------------------------- */

const PW = 4.6;
const PHt = PW * (panelSize.h / panelSize.w);
const deskLayout = [
  { p: V(-5, 1.6, 0.8), ry: 0.24 },
  { p: V(0, 1.6, 0), ry: 0 },
  { p: V(5, 1.6, 0.8), ry: -0.24 },
  { p: V(-5, -1.5, 0.8), ry: 0.24 },
  { p: V(0, -1.5, 0), ry: 0 },
  { p: V(5, -1.5, 0.8), ry: -0.24 },
];
/** Phones show two panels in a column: today and bills. */
const mobLayout: Record<number, THREE.Vector3> = { 0: V(0, 1.55, 0), 2: V(0, -1.55, 0) };

function holoMaterial(seed: number) {
  return ink(new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uMap: { value: null }, uTime: { value: 0 }, uReveal: { value: 0 }, uVis: { value: 0 }, uSeed: { value: seed }, uTint: { value: col(pal.holoTint) }, uEdge: { value: col(pal.violet) } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap; uniform float uTime, uReveal, uVis, uSeed; uniform vec3 uTint, uEdge;
      varying vec2 vUv;
      void main(){
        float front = uReveal * 1.15;
        if (vUv.y > front) discard;
        float sweep = exp(-pow((vUv.y - front) * 40., 2.)) * step(0.001, uReveal) * (1. - step(0.999, uReveal));
        vec2 o = vec2(0.0016, 0.);
        float r = texture2D(uMap, vUv + o).r;
        vec4 t = texture2D(uMap, vUv);
        float b = texture2D(uMap, vUv - o).b;
        vec3 c = vec3(r, t.g, b) * uTint;
        float scan = 0.82 + 0.18 * sin(vUv.y * 520. - uTime * 8.);
        float flicker = 0.94 + 0.06 * sin(uTime * 31. + uSeed * 7.) * sin(uTime * 11. + uSeed);
        float glitch = step(0.985, fract(sin(floor(uTime * 6. + uSeed) * 91.3) * 437.5)) * 0.35;
        c *= scan * flicker * (1. + glitch);
        c *= t.a * 1.25;
        c += uEdge * sweep * 1.4;
        gl_FragColor = vec4(c * uVis, 1.);
        ${outro}
      }`,
  }), 2.2, 0.1);
}

function Hologram({ glow }: { glow: THREE.Texture }) {
  const [texs, setTexs] = useState<THREE.Texture[] | null>(null);
  useEffect(() => {
    let alive = true;
    makeHoloPanels().then((t) => alive && setTexs(t));
    return () => {
      alive = false;
    };
  }, []);
  const mats = useMemo(() => deskLayout.map((_, i) => holoMaterial(i * 1.7)), []);
  useEffect(() => {
    if (texs) mats.forEach((m, i) => (m.uniforms.uMap.value = texs[i]));
  }, [texs, mats]);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const beams = useRef<THREE.Group>(null);
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), phone: V(0, 0, -2) }), []);

  useFrame(() => {
    const k = live.k;
    const conv = smooth(4.22, 4.55, k);
    refs.current.forEach((m, i) => {
      if (!m) return;
      const mob = live.mobile;
      const inMob = i in mobLayout;
      const reveal = smooth(3.62 + i * 0.04, 3.9 + i * 0.04, k);
      const mat = mats[i];
      mat.uniforms.uTime.value = live.time;
      mat.uniforms.uReveal.value = reveal;
      mat.uniforms.uVis.value = (1 - conv) * (mob && !inMob ? 0 : 1);
      const base = mob ? (inMob ? mobLayout[i] : V(0, 0, 0)) : deskLayout[i].p;
      tmp.p.copy(base).add(C);
      tmp.p.y += Math.sin(live.time * 0.8 + i) * 0.08;
      tmp.p.lerp(tmp.phone, conv);
      m.position.copy(tmp.p);
      m.rotation.y = mob ? 0 : deskLayout[i].ry * (1 - conv);
      m.scale.setScalar(Math.max(0.001, 1 - conv * 0.92));
      m.visible = reveal > 0.001 && conv < 0.999;
    });
    if (beams.current) beams.current.visible = k > 3.7 && k < 4.5;
  });

  return (
    <>
      {mats.map((m, i) => (
        <mesh key={i} ref={(el) => void (refs.current[i] = el)} material={m} visible={false} renderOrder={3}>
          <planeGeometry args={[PW, PHt]} />
        </mesh>
      ))}
      <group ref={beams} position={C} visible={false}>
        <Glow glow={glow} color={pal.violet} scale={30} opacity={0.18} />
      </group>
    </>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Act V: the projection above the phone
 * ---------------------------------------------------------------------------------------------- */

function Projection({ glow }: { glow: THREE.Texture }) {
  const group = useRef<THREE.Group>(null);
  const orbRef = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const { beamMat, orbMat, ringMat } = useMemo(() => {
    const beamMat = ink(new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uVis: { value: 0 }, uA: { value: col(pal.violet) }, uB: { value: col(pal.ice) } },
      vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: /* glsl */ `
        uniform float uTime, uVis; uniform vec3 uA, uB; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){
          vec3 V = normalize(cameraPosition - vW);
          float edge = pow(1. - abs(dot(normalize(vN), V)), 1.5);
          float bands = 0.6 + 0.4 * sin(vUv.y * 40. - uTime * 6.);
          float h = vUv.y;
          float a = (0.1 + edge * 0.55) * bands * smoothstep(0., 0.35, h) * (1. - smoothstep(0.75, 1., h));
          gl_FragColor = vec4(mix(uA, uB, h) * a * uVis, 1.);
          ${outro}
        }`,
    }), 1.6, 0.16);
    const orbMat = ink(new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 }, uVis: { value: 0 }, uA: { value: col(pal.violet) }, uB: { value: col(pal.heather) }, uC: { value: col(pal.ice) } },
      vertexShader: /* glsl */ `varying vec3 vObj; varying vec3 vN; varying vec3 vW; void main(){ vObj = position; vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: /* glsl */ `
        uniform float uTime, uVis; uniform vec3 uA, uB, uC; varying vec3 vObj; varying vec3 vN; varying vec3 vW;
        void main(){
          vec3 n = normalize(vObj);
          vec3 V = normalize(cameraPosition - vW);
          float fres = pow(1. - abs(dot(normalize(vN), V)), 2.);
          vec2 g = vec2(atan(n.z, n.x) / 6.2831853 * 18. + uTime * 0.4, asin(n.y) / 3.14159 * 10.);
          vec2 fw = fwidth(g);
          vec2 l = abs(fract(g - 0.5) - 0.5) / fw;
          float grid = 1. - min(min(l.x, l.y), 1.);
          float scan = 0.7 + 0.3 * sin(vW.y * 30. - uTime * 5.);
          vec3 c = mix(uA, uB, 0.5 + 0.5 * n.y) * (fres * 0.8 + grid * 0.4) * scan + uC * fres * 0.25;
          gl_FragColor = vec4(c * uVis * (gl_FrontFacing ? 1. : 0.45), 1.);
          ${outro}
        }`,
    }), 1.8, 0.14);
    const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(pal.roseSoft), transparent: true, opacity: 0, blending: glowBlend(), depthWrite: false, toneMapped: false });
    return { beamMat, orbMat, ringMat };
  }, []);

  const normal = finalNormal;
  const screenCenter = finalScreen;
  const beamLen = holoCenter.clone().sub(screenCenter).length();
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), normal), [normal]);
  const mid = useMemo(() => screenCenter.clone().addScaledVector(normal, beamLen / 2), [screenCenter, normal, beamLen]);

  useFrame(() => {
    const k = live.k;
    // Dim the projection while the feature chapters sit beside the phone.
    const power = smooth(4.78, 4.98, k);
    const on = power * (1 - ramp(5.3, 5.8, 9.2, 9.7, k) * 0.85);
    // Flicker only while it powers up.
    const flick = power < 1 ? 0.6 + 0.4 * Math.sin(live.time * 60) : 1;
    beamMat.uniforms.uTime.value = live.time;
    beamMat.uniforms.uVis.value = on * flick;
    orbMat.uniforms.uTime.value = live.time;
    orbMat.uniforms.uVis.value = on * flick;
    ringMat.opacity = on * 0.5;
    if (group.current) group.current.visible = on > 0.001;
    if (orbRef.current) {
      orbRef.current.scale.set(1, Math.max(0.001, on), 1);
      orbRef.current.rotation.y = live.time * 0.4;
    }
    if (ring.current) ring.current.rotation.z = live.time * 0.3;
  });

  return (
    <group ref={group} visible={false}>
      <mesh position={mid} quaternion={quat} material={beamMat}>
        <cylinderGeometry args={[1.5, 0.55, beamLen, 48, 1, true]} />
      </mesh>
      <group position={holoCenter}>
        <Glow glow={glow} color={pal.violet} scale={9} opacity={0.25} />
        <Glow glow={glow} color={pal.heather} scale={3.4} opacity={0.2} />
        <mesh ref={orbRef} material={orbMat}>
          <sphereGeometry args={[1.35, 64, 40]} />
        </mesh>
        <mesh ref={ring} rotation={[Math.PI / 2 - 0.35, 0, 0]} material={ringMat}>
          <torusGeometry args={[2.7, 0.012, 8, 160]} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------------------------------------ */

function Env() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = isLight() ? 0.9 : 0.35;
    return () => {
      env.dispose();
      pm.dispose();
      scene.environment = null;
    };
  }, [gl, scene]);
  return null;
}

function World({ reduce }: { reduce: boolean }) {
  const glow = useMemo(() => makeGlowTexture(), []);
  return (
    <>
      <Rig reduce={reduce} />
      <Env />
      <ambientLight intensity={isLight() ? 0.9 : 0.15} />
      <pointLight position={[-6, 5, 6]} color={pal.rose} intensity={90} />
      <pointLight position={[6, -3, 5]} color={pal.deep} intensity={110} />
      <pointLight position={[2, 8, 12]} color="#ffffff" intensity={isLight() ? 160 : 50} />
      <pointLight position={[0, 3, -5]} color={pal.violet} intensity={70} />
      <pointLight position={[-10, 8, -20]} color={pal.rose} intensity={260} />
      <pointLight position={[10, -4, -22]} color={pal.violet} intensity={260} />
      <Backdrop />
      <Shadow />
      <Phone glow={glow} />
      <Burst />
      <Machine glow={glow} />
      <Jackpot glow={glow} />
      <Sphere glow={glow} />
      <Network glow={glow} />
      <Hologram glow={glow} />
      <Projection glow={glow} />
    </>
  );
}

export default function StoryScene({ reduce, mode }: { reduce: boolean; mode: "light" | "dark" }) {
  // Materials and textures read the palette as they're built, so a theme change rebuilds the scene.
  theme.mode = mode;
  pal = palettes[mode];
  return (
    <Canvas
      key={mode}
      flat
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      camera={{ fov: 45, near: 0.05, far: 3000, position: [0, 0, 40] }}
      onCreated={({ gl }) => gl.setClearColor(pal.clear)}
    >
      <World reduce={reduce} />
    </Canvas>
  );
}
