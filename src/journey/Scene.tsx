import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { flight, keyframeAt, chapterCount } from "./flight";
import { noise } from "./glsl";
import { integrations, type IntegrationStatus } from "../data/integrations";
import { atlasGrid, makeCardAtlas, makeGlowTexture, notes } from "./textures";

/* ------------------------------------------------------------------------------------------------
 * World layout. The orb sits at the origin; feature planets hang along the flight path.
 * ---------------------------------------------------------------------------------------------- */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export const planets = {
  // Behind the opening camera, so the first chapters stay clean and the turn toward them is a reveal.
  day: V(-38, 4, 44),
  money: V(10, -4, 78),
  world: V(46, 6, 44),
};

type Key = { pos: THREE.Vector3; look: THREE.Vector3; desk: [number, number]; mob: [number, number] };

/** One camera keyframe per chapter. desk/mob place the subject on screen (fraction of width/height). */
const keys: Key[] = [
  { pos: V(0, 1.5, 30), look: V(0, 0, 0), desk: [0.23, 0.02], mob: [0, -0.2] },
  { pos: V(9, 2.5, 13), look: V(-2, 0.5, 0), desk: [0.2, 0], mob: [0, -0.18] },
  { pos: V(0, 13, 21), look: V(0, -1, 0), desk: [0.22, 0], mob: [0, -0.2] },
  { pos: V(-19, 6, 42), look: planets.day, desk: [-0.16, 0], mob: [0, 0.27] },
  { pos: V(-6, 2, 64), look: planets.money, desk: [0.21, 0], mob: [0, 0.27] },
  { pos: V(32, 9, 32), look: planets.world, desk: [-0.17, 0], mob: [0, 0.27] },
  { pos: V(0, 16, 52), look: V(0, 0, -4), desk: [0.21, 0], mob: [0, -0.2] },
  { pos: V(-18, 34, 44), look: V(0, 0, 0), desk: [-0.2, 0], mob: [0, 0.18] },
  { pos: V(0, 3.2, 20), look: V(0, 0, 0), desk: [0, 0.25], mob: [0, 0.27] },
];

const posCurve = new THREE.CatmullRomCurve3(keys.map((k) => k.pos), false, "centripetal");
const lookCurve = new THREE.CatmullRomCurve3(keys.map((k) => k.look), false, "centripetal");

const col = (hex: string) => new THREE.Color(hex);
const palette = {
  rose: "#FF4D7A",
  roseSoft: "#FFB0C4",
  violet: "#A78BFA",
  amber: "#FFA24D",
  coral: "#FF5A4F",
  muted: "#A39DB0",
  hot: "#FFE6EE",
};

/** Live values shared by every component within a frame (written by the camera rig first). */
const live = { k: 0, time: 0, warp: 0, camVel: new THREE.Vector3(), mobile: false };

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** Trapezoid: rises a to b, holds, falls c to d. */
const ramp = (a: number, b: number, c: number, d: number, x: number) => smooth(a, b, x) * (1 - smooth(c, d, x));

const outro = /* glsl */ `#include <colorspace_fragment>`;

/* ------------------------------------------------------------------------------------------------
 * Camera
 * ---------------------------------------------------------------------------------------------- */

function CameraRig({ reduce }: { reduce: boolean }) {
  const { camera, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const s = useRef({ k: 0, px: 0, py: 0, shiftX: 0, shiftY: 0, prev: new THREE.Vector3(), start: -1 });
  const tmp = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3() }), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const st = s.current;
    const t = state.clock.elapsedTime;
    if (st.start < 0) st.start = t;
    live.time = t;
    live.mobile = size.width / size.height < 0.8;

    const target = keyframeAt(flight.progress);
    st.k += (target - st.k) * (1 - Math.exp(-dt * (reduce ? 20 : 5)));
    live.k = st.k;

    const u = Math.min(1, Math.max(0, st.k / (chapterCount - 1)));
    posCurve.getPoint(u, tmp.pos);
    lookCurve.getPoint(u, tmp.look);
    // Portrait screens are narrow: stand further back so subjects fit beside the copy.
    if (live.mobile) tmp.pos.sub(tmp.look).multiplyScalar(1.6).add(tmp.look);

    // Arrival: fly in from deep space on first load.
    const intro = reduce ? 1 : Math.min(1, (t - st.start) / 2.8);
    const introEase = 1 - Math.pow(1 - intro, 4);
    tmp.pos.z += (1 - introEase) * 170;
    tmp.pos.y += (1 - introEase) * 12;

    // Gentle pointer parallax, in camera space.
    st.px += (flight.pointer.x - st.px) * (1 - Math.exp(-dt * 2.5));
    st.py += (flight.pointer.y - st.py) * (1 - Math.exp(-dt * 2.5));
    cam.position.copy(tmp.pos);
    cam.lookAt(tmp.look);
    tmp.right.setFromMatrixColumn(cam.matrixWorld, 0);
    tmp.up.setFromMatrixColumn(cam.matrixWorld, 1);
    const par = reduce ? 0 : 1;
    cam.position.addScaledVector(tmp.right, st.px * 1.1 * par).addScaledVector(tmp.up, st.py * 0.7 * par);
    cam.lookAt(tmp.look);

    // Speed drives the warp streaks and a small field-of-view kick.
    live.camVel.subVectors(cam.position, st.prev).divideScalar(Math.max(dt, 1e-3));
    st.prev.copy(cam.position);
    const speed = live.camVel.length();
    const introWarp = reduce ? 0 : Math.pow(1 - intro, 1.5);
    live.warp = Math.max(introWarp, Math.min(1, Math.max(0, (speed - 6) / 50)));
    cam.fov = 45 + live.warp * 14;

    // Place the subject off-centre so it sits beside the text.
    const i = Math.min(chapterCount - 2, Math.floor(st.k));
    const f = smooth(0, 1, st.k - i);
    const a = live.mobile ? keys[i].mob : keys[i].desk;
    const b = live.mobile ? keys[i + 1].mob : keys[i + 1].desk;
    st.shiftX = a[0] + (b[0] - a[0]) * f;
    st.shiftY = a[1] + (b[1] - a[1]) * f;
    const w = size.width;
    const h = size.height;
    cam.setViewOffset(w, h, -st.shiftX * w, st.shiftY * h, w, h);
    cam.updateProjectionMatrix();

    if (!flight.ready && state.clock.elapsedTime > 0.05) {
      flight.ready = true;
      window.dispatchEvent(new Event("orbit:ready"));
    }
  }, -1);
  return null;
}

/* ------------------------------------------------------------------------------------------------
 * Backdrop: nebula, star field, dust and warp streaks
 * ---------------------------------------------------------------------------------------------- */

function Nebula() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uBase: { value: col("#0B0A10") },
          uRose: { value: col("#E8336B") },
          uViolet: { value: col("#7C4DFF") },
          uAmber: { value: col(palette.amber) },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform vec3 uBase, uRose, uViolet, uAmber;
          varying vec3 vDir;
          ${noise}
          void main(){
            vec3 d = normalize(vDir);
            float n1 = fbm(d*1.8 + vec3(0., uTime*0.004, 0.));
            float n2 = fbm(d*3.6 + vec3(4.1, 1.7, -2.3));
            float band = exp(-pow(dot(d, normalize(vec3(0.35, 1., 0.25)))*3.2, 2.));
            vec3 c = uBase;
            c += uViolet * smoothstep(-0.05, 0.75, n2) * (0.05 + 0.16*band);
            c += uRose * smoothstep(0.1, 0.85, n1) * 0.10 * (0.4 + band);
            c += uAmber * smoothstep(0.45, 0.95, n1*n2*2.) * 0.03;
            gl_FragColor = vec4(c, 1.);
            ${outro}
          }`,
      }),
    [],
  );
  useFrame(() => (mat.uniforms.uTime.value = live.time));
  return (
    <mesh renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[1800, 48, 32]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

function Stars({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const { geo, mat } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const color = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const phase = new Float32Array(count);
    const tints = [col("#ffffff"), col("#ffffff"), col("#ffffff"), col(palette.roseSoft), col(palette.violet), col(palette.amber)];
    for (let i = 0; i < count; i++) {
      const r = 300 + Math.random() * 900;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3);
      const c = tints[Math.floor(Math.random() * tints.length)];
      color.set([c.r, c.g, c.b], i * 3);
      size[i] = Math.random() < 0.04 ? 3 + Math.random() * 2.5 : 0.8 + Math.random() * 1.6;
      phase[i] = Math.random() * 100;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPR: { value: 1 }, uWarp: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute vec3 aColor; attribute float aSize; attribute float aPhase;
        uniform float uTime, uPR, uWarp;
        varying vec3 vColor; varying float vTw;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position,1.);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * uPR * (1.6 + uWarp*1.2);
          vColor = aColor;
          vTw = 0.6 + 0.4*sin(uTime*(0.8 + fract(aPhase)*2.) + aPhase);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uWarp;
        varying vec3 vColor; varying float vTw;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d); a *= a;
          gl_FragColor = vec4(vColor * a * vTw * (0.9 + uWarp), 1.);
          ${outro}
        }`,
    });
    return { geo, mat };
  }, [count]);
  const { gl } = useThree();
  useFrame(() => {
    mat.uniforms.uTime.value = live.time;
    mat.uniforms.uPR.value = gl.getPixelRatio();
    mat.uniforms.uWarp.value = live.warp;
    if (ref.current) ref.current.rotation.y = live.time * 0.004;
  });
  return <points ref={ref} geometry={geo} material={mat} frustumCulled={false} />;
}

/** Near dust and warp streaks, wrapped in a box that travels with the camera. */
function Dust({ count, streaks }: { count: number; streaks: number }) {
  const box = 90;
  const { dustGeo, dustMat, streakGeo, streakMat } = useMemo(() => {
    const wrap = /* glsl */ `
      uniform vec3 uCam; uniform float uBox;
      vec3 wrapPos(vec3 p){ return mod(p - uCam + uBox*0.5, uBox) - uBox*0.5 + uCam; }`;
    const dPos = new Float32Array(count * 3).map(() => Math.random() * box);
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
    const dustMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uCam: { value: new THREE.Vector3() }, uBox: { value: box }, uPR: { value: 1 }, uColor: { value: col(palette.roseSoft) } },
      vertexShader: /* glsl */ `
        ${wrap}
        uniform float uPR; varying float vA;
        void main(){
          vec3 p = wrapPos(position);
          vec4 mv = viewMatrix * vec4(p,1.);
          gl_Position = projectionMatrix * mv;
          float dist = length(p - uCam);
          vA = (1. - smoothstep(uBox*0.28, uBox*0.5, dist)) * smoothstep(1., 4., dist);
          gl_PointSize = uPR * clamp(26. / -mv.z, 0.8, 4.);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; varying float vA;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.1, d) * vA * 0.55;
          gl_FragColor = vec4(uColor * a, 1.);
          ${outro}
        }`,
    });

    const sPos = new Float32Array(streaks * 2 * 3);
    const sEnd = new Float32Array(streaks * 2);
    for (let i = 0; i < streaks; i++) {
      const p = [Math.random() * box, Math.random() * box, Math.random() * box];
      sPos.set(p, i * 6);
      sPos.set(p, i * 6 + 3);
      sEnd[i * 2 + 1] = 1;
    }
    const streakGeo = new THREE.BufferGeometry();
    streakGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    streakGeo.setAttribute("aEnd", new THREE.BufferAttribute(sEnd, 1));
    const streakMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uCam: { value: new THREE.Vector3() },
        uBox: { value: box },
        uDir: { value: new THREE.Vector3(0, 0, 1) },
        uLen: { value: 0 },
        uWarp: { value: 0 },
        uA: { value: col(palette.hot) },
        uB: { value: col(palette.violet) },
      },
      vertexShader: /* glsl */ `
        ${wrap}
        attribute float aEnd; uniform vec3 uDir; uniform float uLen; varying float vEnd; varying float vA;
        void main(){
          vec3 p = wrapPos(position);
          float dist = length(p - uCam);
          p -= uDir * aEnd * uLen;
          vEnd = aEnd;
          vA = (1. - smoothstep(uBox*0.25, uBox*0.5, dist)) * smoothstep(2., 8., dist);
          gl_Position = projectionMatrix * viewMatrix * vec4(p,1.);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uWarp; uniform vec3 uA, uB; varying float vEnd; varying float vA;
        void main(){
          vec3 c = mix(uA, uB, vEnd) * (1. - vEnd) * vA * uWarp;
          gl_FragColor = vec4(c, 1.);
          ${outro}
        }`,
    });
    return { dustGeo, dustMat, streakGeo, streakMat };
  }, [count, streaks]);

  const { camera, gl } = useThree();
  useFrame(() => {
    dustMat.uniforms.uCam.value.copy(camera.position);
    dustMat.uniforms.uPR.value = gl.getPixelRatio();
    streakMat.uniforms.uCam.value.copy(camera.position);
    const v = live.camVel;
    if (v.lengthSq() > 1e-4) streakMat.uniforms.uDir.value.copy(v).normalize();
    streakMat.uniforms.uLen.value = 2 + live.warp * 22;
    streakMat.uniforms.uWarp.value = live.warp;
  });
  return (
    <>
      <points geometry={dustGeo} material={dustMat} frustumCulled={false} />
      <lineSegments geometry={streakGeo} material={streakMat} frustumCulled={false} />
    </>
  );
}

/* ------------------------------------------------------------------------------------------------
 * The Orbit core
 * ---------------------------------------------------------------------------------------------- */

function Glow({ glow, color, scale, opacity, position = [0, 0, 0] }: { glow: THREE.Texture; color: string; scale: number; opacity: number; position?: [number, number, number] }) {
  return (
    <sprite scale={[scale, scale, 1]} position={position}>
      <spriteMaterial map={glow} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
    </sprite>
  );
}

function Core({ glow }: { glow: THREE.Texture }) {
  const R = 2.2;
  const shock = useRef<THREE.Mesh>(null);
  const breath = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [coreMat, coronaMat, shockMat] = useMemo(() => {
    const core = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uRose: { value: col(palette.rose) },
        uViolet: { value: col("#8B5CF6") },
        uAmber: { value: col(palette.amber) },
        uHot: { value: col(palette.hot) },
      },
      vertexShader: /* glsl */ `
        varying vec3 vObj; varying vec3 vN; varying vec3 vV;
        void main(){
          vObj = position;
          vec4 wp = modelMatrix * vec4(position,1.);
          vN = normalize(mat3(modelMatrix) * normal);
          vV = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform vec3 uRose, uViolet, uAmber, uHot;
        varying vec3 vObj; varying vec3 vN; varying vec3 vV;
        ${noise}
        void main(){
          vec3 n = normalize(vObj);
          float t = uTime*0.1;
          float f1 = fbm(n*1.7 + vec3(t, -t*0.7, t*0.4));
          float f2 = fbm(n*4.2 - vec3(t*1.4, t, 0.) + f1*1.5);
          vec3 c = mix(uRose, uViolet, smoothstep(-0.3, 0.5, f1));
          c = mix(c, uAmber, smoothstep(0.2, 0.7, f2) * 0.65);
          float facing = max(dot(normalize(vN), normalize(vV)), 0.);
          c = mix(c, uHot, pow(facing, 2.5) * 0.6);
          c *= 1.1 + 0.6*f2;
          c += uRose * pow(1. - facing, 2.2) * 1.6;
          gl_FragColor = vec4(c, 1.);
          ${outro}
        }`,
    });
    const corona = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uA: { value: col(palette.rose) }, uB: { value: col("#7C4DFF") }, uI: { value: 1 } },
      vertexShader: /* glsl */ `
        varying vec3 vN;
        void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uA, uB; uniform float uI; varying vec3 vN;
        void main(){
          float i = pow(clamp(-vN.z, 0., 1.), 3.2);
          gl_FragColor = vec4(mix(uB, uA, i) * i * 1.3 * uI, 1.);
          ${outro}
        }`,
    });
    const shock = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { uA: { value: 0 }, uC: { value: col(palette.roseSoft) } },
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: /* glsl */ `
        uniform float uA; uniform vec3 uC; varying vec2 vUv;
        void main(){
          float r = length(vUv - 0.5) * 2.;
          float ring = exp(-pow((r - 0.92) * 28., 2.)) + exp(-pow((r - 0.8) * 10., 2.)) * 0.25;
          gl_FragColor = vec4(uC * ring * uA, 1.);
          ${outro}
        }`,
    });
    return [core, corona, shock];
  }, []);

  useFrame(() => {
    coreMat.uniforms.uTime.value = live.time;
    // Shockwave as the noise snaps into orbit (chapter 2).
    const o = smooth(1.15, 2.05, live.k);
    const pulse = Math.sin(Math.min(1, o / 0.7) * Math.PI) * (o < 0.7 ? 1 : 0);
    if (shock.current) {
      const s = 3 + o * 34;
      shock.current.scale.set(s, s, s);
      shock.current.quaternion.copy(camera.quaternion);
    }
    shockMat.uniforms.uA.value = pulse * 0.7;
    coronaMat.uniforms.uI.value = 1 + pulse * 0.8 + ramp(7.4, 8, 9, 10, live.k) * 0.5;
    if (breath.current) breath.current.scale.setScalar(1 + Math.sin(live.time * 1.3) * 0.012);
  });

  return (
    <group>
      <group ref={breath}>
        <mesh>
          <sphereGeometry args={[R, 96, 64]} />
          <primitive object={coreMat} attach="material" />
        </mesh>
        <mesh scale={1.75}>
          <sphereGeometry args={[R, 64, 48]} />
          <primitive object={coronaMat} attach="material" />
        </mesh>
      </group>
      <Glow glow={glow} color={palette.hot} scale={9} opacity={0.35} />
      <Glow glow={glow} color={palette.rose} scale={22} opacity={0.5} />
      <Glow glow={glow} color="#7C4DFF" scale={52} opacity={0.22} />
      <mesh ref={shock}>
        <planeGeometry args={[1, 1]} />
        <primitive object={shockMat} attach="material" />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Notification debris: chaos in chapter 1, ordered orbital rings from chapter 2 onward
 * ---------------------------------------------------------------------------------------------- */

const rings = [
  { r: 7.2, n: 14, speed: 0.11, tilt: new THREE.Euler(0.32, 0, 0.12) },
  { r: 10.4, n: 20, speed: -0.07, tilt: new THREE.Euler(-0.22, 0, -0.28) },
  { r: 13.8, n: 26, speed: 0.045, tilt: new THREE.Euler(0.12, 0, 0.42) },
];

function Debris() {
  const [atlas, setAtlas] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let alive = true;
    makeCardAtlas().then((t) => alive && setAtlas(t));
    return () => {
      alive = false;
    };
  }, []);

  const { geo, mat } = useMemo(() => {
    const total = rings.reduce((a, r) => a + r.n, 0);
    const base = new THREE.PlaneGeometry(1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    geo.setAttribute("position", base.getAttribute("position"));
    geo.setAttribute("uv", base.getAttribute("uv"));
    geo.instanceCount = total;
    const chaos = new Float32Array(total * 3);
    const axis = new Float32Array(total * 3);
    const spin = new Float32Array(total * 2);
    const ring = new Float32Array(total * 4);
    const tile = new Float32Array(total);
    const delay = new Float32Array(total);
    let i = 0;
    rings.forEach((rg, ri) => {
      for (let j = 0; j < rg.n; j++, i++) {
        // Scatter in a lopsided shell, avoiding the core.
        const r = 4.5 + Math.pow(Math.random(), 0.7) * 17;
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        chaos.set([r * Math.sin(ph) * Math.cos(th) * 1.25, r * Math.cos(ph) * 0.7, r * Math.sin(ph) * Math.sin(th)], i * 3);
        const ax = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        axis.set([ax.x, ax.y, ax.z], i * 3);
        spin.set([(Math.random() - 0.5) * 1.6, Math.random() * 6.28], i * 2);
        ring.set([rg.r + (Math.random() - 0.5) * 0.6, (j / rg.n) * Math.PI * 2 + Math.random() * 0.1, rg.speed, ri], i * 4);
        tile[i] = i % notes.length;
        delay[i] = Math.random() * 0.45;
      }
    });
    geo.setAttribute("aChaos", new THREE.InstancedBufferAttribute(chaos, 3));
    geo.setAttribute("aAxis", new THREE.InstancedBufferAttribute(axis, 3));
    geo.setAttribute("aSpin", new THREE.InstancedBufferAttribute(spin, 2));
    geo.setAttribute("aRing", new THREE.InstancedBufferAttribute(ring, 4));
    geo.setAttribute("aTile", new THREE.InstancedBufferAttribute(tile, 1));
    geo.setAttribute("aDelay", new THREE.InstancedBufferAttribute(delay, 1));

    const tilts = rings.map((r) => new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromEuler(r.tilt)));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
      uniforms: {
        uTime: { value: 0 },
        uOrder: { value: 0 },
        uNear: { value: 3.5 },
        uReveal: { value: 0 },
        uMap: { value: null },
        uGrid: { value: new THREE.Vector2(atlasGrid.cols, atlasGrid.rows) },
        uSize: { value: new THREE.Vector2(2.3, 0.575) },
        uTilt: { value: tilts },
        uGlow: { value: col(palette.rose) },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aChaos; attribute vec3 aAxis; attribute vec2 aSpin; attribute vec4 aRing; attribute float aTile; attribute float aDelay;
        uniform float uTime, uOrder, uNear; uniform vec2 uSize; uniform mat3 uTilt[3];
        varying vec2 vUv; varying float vTile; varying float vFade; varying float vOrder;
        vec3 rotAxis(vec3 v, vec3 a, float t){ return v*cos(t) + cross(a, v)*sin(t) + a*dot(a, v)*(1. - cos(t)); }
        void main(){
          float o = smoothstep(aDelay, aDelay + 0.55, uOrder);
          o = o*o*(3. - 2.*o);
          vec3 chaos = aChaos + 0.8*vec3(sin(uTime*0.31 + aSpin.y), cos(uTime*0.23 + aSpin.y*1.3), sin(uTime*0.27 + aSpin.y*0.7));
          chaos = rotAxis(chaos, vec3(0.,1.,0.), uTime*0.035);
          float ang = aRing.y + uTime*aRing.z;
          vec3 rp = vec3(cos(ang)*aRing.x, 0., sin(ang)*aRing.x);
          int ri = int(aRing.w + 0.5);
          rp = (ri == 0 ? uTilt[0] : ri == 1 ? uTilt[1] : uTilt[2]) * rp;
          // Swoop: an arc on the way in, so cards spiral rather than slide.
          vec3 center = mix(chaos, rp, o) + vec3(0., sin(o*3.14159)*2.2, 0.);
          vec2 corner = position.xy * uSize * mix(1., 0.78, o);
          vec3 tumble = rotAxis(vec3(corner, 0.), aAxis, aSpin.y + uTime*aSpin.x*(1. - o));
          vec4 mv = modelViewMatrix * vec4(center, 1.);
          vec3 off = mix(mat3(modelViewMatrix) * tumble, vec3(corner, 0.), o);
          mv.xyz += off;
          gl_Position = projectionMatrix * mv;
          vUv = uv; vTile = aTile; vOrder = o;
          float d = -mv.z;
          vFade = smoothstep(uNear * 0.5, uNear, d) * (1. - smoothstep(70., 120., d));
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap; uniform vec2 uGrid; uniform float uReveal; uniform vec3 uGlow;
        varying vec2 vUv; varying float vTile; varying float vFade; varying float vOrder;
        void main(){
          vec2 uv = vUv;
          float tile = floor(vTile + 0.5); float c = mod(tile, uGrid.x); float r = floor(tile / uGrid.x);
          vec2 auv = vec2((c + uv.x) / uGrid.x, 1. - (r + 1. - uv.y) / uGrid.y);
          vec4 t = texture2D(uMap, auv);
          float a = t.a * vFade * uReveal;
          if (a < 0.04) discard;
          vec3 rgb = t.rgb;
          // The back of a card is blank: dark glass with a soft rose sheen.
          if (!gl_FrontFacing) rgb = mix(vec3(0.075, 0.066, 0.1), uGlow * 0.35, (1. - uv.y) * 0.35);
          // A faint rose edge-light once cards are in orbit.
          float edge = smoothstep(0.42, 0.5, max(abs(uv.x - 0.5), abs(uv.y - 0.5) * 0.25 + 0.375));
          rgb += uGlow * edge * 0.25 * vOrder;
          gl_FragColor = vec4(rgb, a);
          ${outro}
        }`,
    });
    return { geo, mat };
  }, []);

  useEffect(() => {
    if (atlas) mat.uniforms.uMap.value = atlas;
  }, [atlas, mat]);

  useFrame((_, dt) => {
    mat.uniforms.uTime.value = live.time;
    mat.uniforms.uOrder.value = smooth(1.15, 2.1, live.k) * 1.45;
    // Clear the foreground for the finale so the call to action stays readable.
    mat.uniforms.uNear.value = 3.5 + smooth(7.3, 8, live.k) * 10.5;
    if (atlas) mat.uniforms.uReveal.value = Math.min(1, mat.uniforms.uReveal.value + dt * 1.2);
  });

  if (!atlas) return null;
  return <mesh geometry={geo} material={mat} frustumCulled={false} />;
}

function OrbitLines() {
  const mats = useMemo(
    () =>
      rings.map(
        (_, i) =>
          new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: { uTime: { value: 0 }, uVis: { value: 0 }, uC: { value: col(i === 1 ? palette.violet : palette.rose) }, uS: { value: rings[i].speed } },
            vertexShader: /* glsl */ `attribute float aA; varying float vA; void main(){ vA = aA; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
            fragmentShader: /* glsl */ `
              uniform float uTime, uVis, uS; uniform vec3 uC; varying float vA;
              void main(){
                float pos = uTime*uS/6.2831853;
                float head = uS > 0. ? fract(vA - pos) : fract(pos - vA);
                float comet = pow(head, 8.);
                gl_FragColor = vec4(uC * (0.16 + comet*0.9) * uVis, 1.);
                ${outro}
              }`,
          }),
      ),
    [],
  );
  const geos = useMemo(
    () =>
      rings.map((rg) => {
        const n = 256;
        const pos = new Float32Array((n + 1) * 3);
        const a = new Float32Array(n + 1);
        for (let i = 0; i <= n; i++) {
          const t = (i / n) * Math.PI * 2;
          pos.set([Math.cos(t) * rg.r, 0, Math.sin(t) * rg.r], i * 3);
          a[i] = i / n;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        g.setAttribute("aA", new THREE.BufferAttribute(a, 1));
        return g;
      }),
    [],
  );
  const lines = useMemo(() => geos.map((g, i) => new THREE.Line(g, mats[i])), [geos, mats]);
  useFrame(() => {
    const v = smooth(1.5, 2.2, live.k);
    mats.forEach((m) => {
      m.uniforms.uTime.value = live.time;
      m.uniforms.uVis.value = v;
    });
  });
  return (
    <>
      {rings.map((rg, i) => (
        <group key={i} rotation={rg.tilt}>
          <primitive object={lines[i]} />
        </group>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Feature planets
 * ---------------------------------------------------------------------------------------------- */

type PlanetSpec = {
  pos: THREE.Vector3;
  r: number;
  a: string;
  b: string;
  c: string;
  atmo: string;
  bands: number;
  seed: number;
  ring?: string;
  chapter: number;
  tilt: number;
};

const planetSpecs: PlanetSpec[] = [
  { pos: planets.day, r: 5, a: "#FF4D7A", b: "#2A1320", c: "#FFB0C4", atmo: "#FF4D7A", bands: 1, seed: 1.3, chapter: 3, tilt: 0.3 },
  { pos: planets.money, r: 6, a: "#FFA24D", b: "#2B160C", c: "#FFD9B0", atmo: "#FFA24D", bands: 1, seed: 7.1, ring: "#FFB27A", chapter: 4, tilt: -0.42 },
  { pos: planets.world, r: 4.5, a: "#A78BFA", b: "#15122B", c: "#E4DAFF", atmo: "#A78BFA", bands: 0, seed: 3.7, chapter: 5, tilt: 0.18 },
];

function bodyMaterial(p: { a: string; b: string; c: string; atmo: string; bands: number; seed: number }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uA: { value: col(p.a) },
      uB: { value: col(p.b) },
      uC: { value: col(p.c) },
      uAtmo: { value: col(p.atmo) },
      uBands: { value: p.bands },
      uSeed: { value: p.seed },
      uTime: { value: 0 },
      uBoost: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vObj; varying vec3 vN; varying vec3 vW;
      void main(){
        vObj = position;
        vec4 wp = modelMatrix * vec4(position,1.);
        vW = wp.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uA, uB, uC, uAtmo; uniform float uBands, uSeed, uTime, uBoost;
      varying vec3 vObj; varying vec3 vN; varying vec3 vW;
      ${noise}
      void main(){
        vec3 n = normalize(vObj);
        vec3 N = normalize(vN);
        vec3 V = normalize(cameraPosition - vW);
        vec3 L = normalize(-vW);
        float warp = fbm(n*2.5 + uSeed);
        float gas = fbm(vec3(n.x*1.2, n.y*7. + warp*1.6, n.z*1.2) + uSeed + vec3(uTime*0.01, 0., 0.));
        float land = fbm(n*2.2 + warp*0.8 + uSeed);
        float f = mix(land, gas, uBands);
        vec3 c = mix(uB, uA, smoothstep(-0.45, 0.35, f));
        c = mix(c, uC, smoothstep(0.3, 0.75, f) * 0.8);
        float lit = smoothstep(-0.25, 1., dot(N, L));
        float fres = pow(1. - max(dot(N, V), 0.), 3.);
        vec3 col = c * (0.035 + 1.15*lit);
        col += uAtmo * fres * (0.2 + 1.1*lit) * (1. + uBoost);
        gl_FragColor = vec4(col, 1.);
        #include <colorspace_fragment>
      }`,
  });
}

function atmoMaterial(color: string) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uC: { value: col(color) }, uBoost: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vWN; varying vec3 vW;
      void main(){
        vN = normalize(normalMatrix * normal);
        vWN = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position,1.); vW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uC; uniform float uBoost; varying vec3 vN; varying vec3 vWN; varying vec3 vW;
      void main(){
        float i = pow(clamp(-vN.z, 0., 1.), 2.2);
        float lit = 0.35 + 0.65*smoothstep(-0.4, 1., dot(normalize(vWN), normalize(-vW)));
        gl_FragColor = vec4(uC * i * lit * (1.1 + uBoost*1.2), 1.);
        #include <colorspace_fragment>
      }`,
  });
}

function Planet({ spec, glow }: { spec: PlanetSpec; glow: THREE.Texture }) {
  const spin = useRef<THREE.Group>(null);
  const moon = useRef<THREE.Group>(null);
  const { body, atmo, ringMat, moonMat } = useMemo(() => {
    const ringMat = spec.ring
      ? new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          uniforms: { uC: { value: col(spec.ring) }, uIn: { value: spec.r * 1.45 }, uOut: { value: spec.r * 2.5 } },
          vertexShader: /* glsl */ `varying vec3 vP; varying vec3 vW; void main(){ vP = position; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
          fragmentShader: /* glsl */ `
            uniform vec3 uC; uniform float uIn, uOut; varying vec3 vP; varying vec3 vW;
            ${noise}
            void main(){
              float r = (length(vP.xy) - uIn) / (uOut - uIn);
              float b = 0.5 + 0.5*snoise(vec3(r*34., 0.5, 0.));
              b *= 0.55 + 0.45*snoise(vec3(r*9., 3., 1.));
              float edge = smoothstep(0., 0.06, r) * (1. - smoothstep(0.9, 1., r));
              float a = clamp(b, 0., 1.) * edge * 0.75;
              gl_FragColor = vec4(uC * (0.7 + b*0.6), a);
              #include <colorspace_fragment>
            }`,
        })
      : null;
    const moonMat = bodyMaterial({ a: "#A39DB0", b: "#1A1822", c: "#F8F6FB", atmo: spec.atmo, bands: 0, seed: spec.seed + 11 });
    return { body: bodyMaterial(spec), atmo: atmoMaterial(spec.atmo), ringMat, moonMat };
  }, [spec]);

  useFrame(() => {
    const focus = 1 - Math.min(1, Math.abs(live.k - spec.chapter));
    body.uniforms.uTime.value = live.time;
    body.uniforms.uBoost.value = focus * 0.6;
    atmo.uniforms.uBoost.value = focus;
    if (spin.current) spin.current.rotation.y = live.time * 0.03 + spec.seed;
    if (moon.current) moon.current.rotation.y = live.time * 0.12 + spec.seed;
  });

  return (
    <group position={spec.pos}>
      <Glow glow={glow} color={spec.atmo} scale={spec.r * 5} opacity={0.16} />
      <group rotation={[0, 0, spec.tilt]}>
        <group ref={spin}>
          <mesh>
            <sphereGeometry args={[spec.r, 96, 64]} />
            <primitive object={body} attach="material" />
          </mesh>
        </group>
        <mesh scale={1.12}>
          <sphereGeometry args={[spec.r, 64, 48]} />
          <primitive object={atmo} attach="material" />
        </mesh>
        {ringMat && (
          <mesh rotation={[-Math.PI / 2 + 0.25, 0, 0]}>
            <ringGeometry args={[spec.r * 1.45, spec.r * 2.5, 160, 1]} />
            <primitive object={ringMat} attach="material" />
          </mesh>
        )}
        <group ref={moon} rotation={[0.3, 0, 0.2]}>
          <mesh position={[spec.r * (spec.ring ? 3.1 : 2.4), 0, 0]}>
            <sphereGeometry args={[spec.r * 0.16, 32, 24]} />
            <primitive object={moonMat} attach="material" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Privacy shield
 * ---------------------------------------------------------------------------------------------- */

function Shield() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uVis: { value: 0 }, uReveal: { value: 0 }, uA: { value: col(palette.rose) }, uB: { value: col(palette.violet) } },
        vertexShader: /* glsl */ `
          varying vec3 vObj; varying vec3 vN; varying vec3 vW;
          void main(){ vObj = position; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*viewMatrix*w; }`,
        fragmentShader: /* glsl */ `
          uniform float uTime, uVis, uReveal; uniform vec3 uA, uB;
          varying vec3 vObj; varying vec3 vN; varying vec3 vW;
          void main(){
            vec3 n = normalize(vObj);
            vec3 V = normalize(cameraPosition - vW);
            float fres = pow(1. - abs(dot(normalize(vN), V)), 2.6);
            // Hexagonal cells, projected from the dominant axis.
            vec2 p = (abs(n.y) > 0.7 ? n.xz : abs(n.x) > abs(n.z) ? n.yz : n.xy) * 11.;
            vec2 r = vec2(1., 1.7320508);
            vec2 h = r * 0.5;
            vec2 a = mod(p, r) - h;
            vec2 b = mod(p - h, r) - h;
            vec2 g = dot(a, a) < dot(b, b) ? a : b;
            vec2 q = abs(g);
            float hexd = 0.5 - max(dot(q, normalize(r)), q.x);
            float line = 1. - smoothstep(0.0, 0.05, hexd);
            // Assembles from the south pole up, with a bright seam at the front.
            float front = uReveal * 2.3 - 1.15;
            float mask = smoothstep(front + 0.04, front - 0.04, n.y);
            float seam = exp(-pow((n.y - front) * 16., 2.)) * step(0.001, uReveal) * (1. - step(0.999, uReveal));
            float scan = exp(-pow((n.y - sin(uTime * 0.45) * 0.95) * 9., 2.));
            vec3 c = mix(uB, uA, 0.5 + 0.5*n.y);
            float i = (fres * 0.55 + line * (0.07 + fres * 0.5) + scan * line * 0.35 + scan * 0.03) * mask + seam * 0.9;
            gl_FragColor = vec4(c * i * uVis, 1.);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  useFrame(() => {
    mat.uniforms.uTime.value = live.time;
    mat.uniforms.uReveal.value = smooth(5.15, 6.0, live.k);
    mat.uniforms.uVis.value = Math.max(ramp(5.1, 5.5, 6.5, 7.1, live.k), ramp(5.1, 5.5, 7.2, 7.8, live.k) * 0.4);
  });
  return (
    <mesh>
      <sphereGeometry args={[17, 96, 64]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Integrations constellation
 * ---------------------------------------------------------------------------------------------- */

const statusTone: Record<IntegrationStatus, string> = { "In development": palette.rose, "Coming soon": palette.violet, Planned: palette.muted };
const nodeTones = integrations.map((i) => statusTone[i.status]);

const nodes = nodeTones.map((_, i) => {
  const a = (i / nodeTones.length) * Math.PI * 2 + 0.35;
  const r = 24 + (i % 3) * 2.2;
  const y = Math.sin(i * 2.1) * 5 + 2;
  return V(Math.cos(a) * r, y, Math.sin(a) * r * 0.8);
});

function Constellation({ glow }: { glow: THREE.Texture }) {
  const group = useRef<THREE.Group>(null);
  const nodeRefs = useRef<(THREE.Group | null)[]>([]);
  const { geo, mat } = useMemo(() => {
    const seg = 64;
    const pos: number[] = [];
    const t: number[] = [];
    const idx: number[] = [];
    const color: number[] = [];
    const pts = new THREE.Vector3();
    nodes.forEach((n, i) => {
      const end = n.clone().normalize().multiplyScalar(2.6);
      const ctrl = n.clone().add(end).multiplyScalar(0.5).add(V(0, 7, 0));
      const curve = new THREE.QuadraticBezierCurve3(n, ctrl, end);
      const c = col(nodeTones[i]);
      for (let s = 0; s < seg; s++) {
        for (const e of [s, s + 1]) {
          curve.getPoint(e / seg, pts);
          pos.push(pts.x, pts.y, pts.z);
          t.push(e / seg);
          idx.push(i);
          color.push(c.r, c.g, c.b);
        }
      }
      // Faint links between neighbouring nodes.
      const m = nodes[(i + 1) % nodes.length];
      for (let s = 0; s < 16; s++) {
        for (const e of [s, s + 1]) {
          pts.lerpVectors(n, m, e / 16);
          pos.push(pts.x, pts.y, pts.z);
          t.push(-1);
          idx.push(i);
          color.push(c.r * 0.5, c.g * 0.5, c.b * 0.5);
        }
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("aT", new THREE.Float32BufferAttribute(t, 1));
    geo.setAttribute("aI", new THREE.Float32BufferAttribute(idx, 1));
    geo.setAttribute("aColor", new THREE.Float32BufferAttribute(color, 3));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uVis: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute float aT; attribute float aI; attribute vec3 aColor;
        varying float vT; varying float vI; varying vec3 vC;
        void main(){ vT = aT; vI = aI; vC = aColor; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: /* glsl */ `
        uniform float uTime, uReveal, uVis; varying float vT; varying float vI; varying vec3 vC;
        void main(){
          float rev = uReveal * 1.4 - vI * 0.05;
          if (vT < 0.) { gl_FragColor = vec4(vC * 0.35 * smoothstep(0.7, 1., rev) * uVis, 1.);
            #include <colorspace_fragment>
            return; }
          float shown = step(vT, rev);
          float p = fract(uTime * 0.32 + vI * 0.137);
          float pulse = exp(-pow((vT - p) * 16., 2.));
          vec3 c = vC * (0.3 + pulse * 2.2) * shown * uVis;
          gl_FragColor = vec4(c, 1.);
          #include <colorspace_fragment>
        }`,
    });
    return { geo, mat };
  }, []);

  const { camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const vis = Math.max(ramp(6.2, 6.7, 8.1, 8.8, live.k), smooth(6.2, 6.7, live.k) * 0.35);
    mat.uniforms.uTime.value = live.time;
    mat.uniforms.uReveal.value = smooth(6.2, 7.0, live.k);
    mat.uniforms.uVis.value = vis;
    nodeRefs.current.forEach((g, i) => {
      if (!g) return;
      const on = smooth(0.1 + i * 0.05, 0.4 + i * 0.05, mat.uniforms.uReveal.value);
      g.scale.setScalar(Math.max(0.001, on * vis * (1 + Math.sin(live.time * 2 + i) * 0.08)));
    });
    // Pin the HTML labels to their nodes.
    const labelVis = ramp(6.5, 6.9, 7.5, 7.85, live.k);
    flight.labels.forEach((el, i) => {
      if (!el || !nodes[i]) return;
      v.copy(nodes[i]).project(camera);
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      // Keep labels clear of the copy column on the right.
      const side = 1 - smooth(0.5, 0.56, x / size.width);
      const on = smooth(0.2 + i * 0.05, 0.5 + i * 0.05, mat.uniforms.uReveal.value) * labelVis * side * (v.z < 1 ? 1 : 0);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%) translateY(-18px)`;
      el.style.opacity = on.toFixed(3);
    });
  });

  return (
    <group ref={group}>
      <lineSegments geometry={geo} material={mat} frustumCulled={false} />
      {nodes.map((n, i) => (
        <group key={i} position={n} ref={(el) => void (nodeRefs.current[i] = el)}>
          <Glow glow={glow} color={nodeTones[i]} scale={5} opacity={0.55} />
          <Glow glow={glow} color={palette.hot} scale={1.2} opacity={0.9} />
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------------------------------------ */

function World({ reduce }: { reduce: boolean }) {
  const glow = useMemo(() => makeGlowTexture(), []);
  const small = typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <>
      <CameraRig reduce={reduce} />
      <Nebula />
      <Stars count={small ? 2500 : 5000} />
      <Dust count={small ? 500 : 1100} streaks={small ? 220 : 480} />
      <Core glow={glow} />
      <OrbitLines />
      <Debris />
      {planetSpecs.map((p) => (
        <Planet key={p.chapter} spec={p} glow={glow} />
      ))}
      <Shield />
      <Constellation glow={glow} />
    </>
  );
}

export default function Scene({ reduce }: { reduce: boolean }) {
  return (
    <Canvas
      flat
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      camera={{ fov: 45, near: 0.1, far: 5000, position: [0, 14, 200] }}
      onCreated={({ gl }) => gl.setClearColor("#0B0A10")}
    >
      <World reduce={reduce} />
    </Canvas>
  );
}
