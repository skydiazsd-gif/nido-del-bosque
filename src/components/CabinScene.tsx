import { Component, useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentRef, ReactNode } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { CabinDesign, Finish } from '../types'

type View = 'Perspective' | 'Front' | 'Rear' | 'Aerial'
type Point = [number, number, number]

const palettes: Record<Finish, { wood: string; trim: string; accent: string }> = {
  natural: { wood: '#a97546', trim: '#29332e', accent: '#c89a68' },
  charcoal: { wood: '#414846', trim: '#242c29', accent: '#b58b5c' },
  light: { wood: '#d0b68a', trim: '#353c35', accent: '#dfc9a3' },
  mixed: { wood: '#a28a70', trim: '#3c423e', accent: '#adaba0' },
}

function Block({ position, size, color, rotation, ...props }: {
  position: Point; size: Point; color: string; rotation?: Point; castShadow?: boolean; receiveShadow?: boolean
}) {
  return <mesh position={position} rotation={rotation} castShadow receiveShadow {...props}>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={0.86} />
  </mesh>
}

function Beam({ start, end, radius = 0.025, color = '#353e35' }: {
  start: Point; end: Point; radius?: number; color?: string
}) {
  const { midpoint, length, quaternion } = useMemo(() => {
    const from = new THREE.Vector3(...start)
    const to = new THREE.Vector3(...end)
    const delta = to.clone().sub(from)
    return {
      midpoint: from.add(to).multiplyScalar(0.5),
      length: delta.length(),
      quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()),
    }
  }, [start, end])
  return <mesh position={midpoint} quaternion={quaternion} castShadow>
    <cylinderGeometry args={[radius, radius, length, 7]} />
    <meshStandardMaterial color={color} roughness={0.7} />
  </mesh>
}

function Glass({ position, size }: { position: Point; size: Point }) {
  return <mesh position={position}>
    <boxGeometry args={size} />
    <meshPhysicalMaterial color="#accac0" transparent opacity={0.24} roughness={0.15} metalness={0.05} depthWrite={false} />
  </mesh>
}

function Tree({ position, scale = 1, shade = '#66765c' }: { position: Point; scale?: number; shade?: string }) {
  return <group position={position} scale={scale}>
    <mesh position={[0, 2, 0]} castShadow>
      <cylinderGeometry args={[0.11, 0.2, 4, 7]} />
      <meshStandardMaterial color="#807663" roughness={1} />
    </mesh>
    {[[0, 4.5, 0, 1.5], [-0.65, 3.75, 0.25, 1.05], [0.65, 4.1, -0.3, 1.2]].map(([x, y, z, radius], i) =>
      <mesh key={i} position={[x, y, z]} scale={[1, 1.1, 0.95]} castShadow>
        <icosahedronGeometry args={[radius, 1]} />
        <meshStandardMaterial color={shade} roughness={1} flatShading />
      </mesh>,
    )}
  </group>
}

function Cabin({ design }: { design: CabinDesign }) {
  const { length: l, width: w, elevation: e, terraceWidth: tw, terraceDepth: td } = design
  const { wood, trim, accent } = palettes[design.finish]
  const pitch = THREE.MathUtils.degToRad(design.roofPitch)
  const slope = Math.tan(pitch)
  const height = Math.max(3.25, 2.6 + w / 2 * slope)
  const frontHeight = height - w / 2 * slope
  const backHeight = height + w / 2 * slope
  const sideSlats = Math.ceil(w / 0.17)
  const backSlats = Math.ceil(l / 0.17)
  const stepCount = Math.max(8, Math.ceil(e / 0.185))
  const tread = 0.26
  const stairX = -tw / 2 + 0.58
  const terraceFront = w / 2 + td
  // Mirror the model so the bedroom is on +x, matching the floor plan.
  return <group scale={[-1, 1, 1]}>
    {/* The slab top is the elevation datum; all model units are metres. */}
    <Block position={[0, e - 0.12, 0]} size={[l + 0.12, 0.24, w + 0.12]} color={trim} />
    <Block position={[0, e + 0.035, 0]} size={[l - 0.12, 0.07, w - 0.12]} color="#beaa87" />
    {[-l / 2 + 0.35, 0, l / 2 - 0.35].flatMap((x, i) => [-w / 2 + 0.35, w / 2 - 0.35].map((z, j) =>
      <group key={`${i}-${j}`}>
        <Block position={[x, (e - 0.24) / 2, z]} size={[0.18, e - 0.24, 0.18]} color={trim} />
        <Block position={[x, 0.04, z]} size={[0.48, 0.08, 0.48]} color="#b3aea0" />
      </group>,
    ))}
    {[-w / 2 + 0.35, w / 2 - 0.35].map((z) => <Block key={z} position={[0, e - 0.3, z]} size={[l, 0.16, 0.16]} color={trim} />)}
    {/* Rear cladding and side slats meet the mono-pitch roof line. */}
    {Array.from({ length: backSlats }, (_, i) => {
      const x = -l / 2 + (i + 0.5) * l / backSlats
      return <Block key={`rear-${i}`} position={[x, e + backHeight / 2, -w / 2]} size={[l / backSlats - 0.012, backHeight, 0.13]} color={i % 4 === 0 ? accent : wood} />
    })}
    {[-1, 1].flatMap((side) => Array.from({ length: sideSlats }, (_, i) => {
      const z = -w / 2 + (i + 0.5) * w / sideSlats
      const h = height - z * slope
      // A tall side window opens up the living corner.
      const glazed = side === 1 && z > -w * 0.17 && z < w * 0.34
      return <group key={`side-${side}-${i}`}>
        <Block position={[side * l / 2, e + (glazed ? 0.27 : h / 2), z]} size={[0.13, glazed ? 0.54 : h, w / sideSlats - 0.01]} color={i % 5 === 0 ? accent : wood} />
        {glazed && <>
          <Glass position={[side * l / 2, e + h / 2 + 0.22, z]} size={[0.035, h - 0.62, w / sideSlats]} />
          <Block position={[side * l / 2, e + h - 0.05, z]} size={[0.15, 0.1, w / sideSlats]} color={trim} />
        </>}
      </group>
    }))}
    {/* Timber bedroom bay on the left, forest-facing glazing on the right. */}
    {Array.from({ length: Math.ceil(backSlats * 0.31) }, (_, i) => {
      const bayWidth = l * 0.31
      const count = Math.ceil(backSlats * 0.31)
      const x = -l / 2 + (i + 0.5) * bayWidth / count
      return <Block key={`front-${i}`} position={[x, e + frontHeight / 2, w / 2]} size={[bayWidth / count - 0.012, frontHeight, 0.13]} color={i % 4 === 0 ? accent : wood} />
    })}
    <Glass position={[l * 0.155, e + frontHeight / 2, w / 2]} size={[l * 0.69, frontHeight - 0.12, 0.04]} />
    {[0, 1, 2, 3].map((i) => <Block key={`frame-${i}`} position={[-l * 0.19 + i * l * 0.69 / 3, e + frontHeight / 2, w / 2 + 0.035]} size={[0.065, frontHeight, 0.09]} color={trim} />)}
    {[e + 0.05, e + frontHeight - 0.05].map((y) => <Block key={y} position={[l * 0.155, y, w / 2 + 0.035]} size={[l * 0.69, 0.1, 0.1]} color={trim} />)}
    <Block position={[0, e + height + 0.085, 0]} size={[l + 0.85, 0.16, (w + 0.85) / Math.cos(pitch)]} rotation={[pitch, 0, 0]} color="#303a35" />
    <Block position={[0, e + frontHeight + 0.04, w / 2 + 0.4]} size={[l + 0.84, 0.12, 0.09]} color={trim} />
    {/* Spare, warm interior furniture makes the glazing legible. */}
    <Block position={[l * 0.27, e + 0.23, w * 0.1]} size={[2, 0.44, 0.85]} color="#d0c6ae" />
    <Block position={[l * 0.27, e + 0.6, w * 0.1 - 0.38]} size={[2, 0.5, 0.15]} color="#d0c6ae" />
    <Block position={[l * 0.24, e + 0.2, w * 0.1 + 1]} size={[1.2, 0.1, 0.65]} color="#916e4b" />
    {[-0.43, 0.43].map((x) => <Block key={`table-${x}`} position={[l * 0.24 + x, e + 0.08, w * 0.1 + 1]} size={[0.05, 0.16, 0.45]} color={trim} />)}
    <Block position={[-l * 0.28, e + 0.27, w * 0.12]} size={[1.7, 0.48, 2]} color="#d6c7ac" />
    <Block position={[-l * 0.28, e + 0.53, w * 0.12 - 0.08]} size={[1.65, 0.15, 1.75]} color="#f0e9d9" />
    <Block position={[l * 0.12, e + 0.45, -w / 2 + 0.45]} size={[l * 0.5, 0.9, 0.7]} color="#aa8d62" />
    <Block position={[l * 0.12, e + 0.93, -w / 2 + 0.45]} size={[l * 0.51, 0.07, 0.75]} color="#dbd6c5" />
    {/* The right-hand 38% is a bedroom, with a rear bathroom occupying 35% of its depth. */}
    <Block position={[-l * 0.12, e + 1.2, -0.5]} size={[0.12, 2.4, w - 1]} color="#ded7c7" />
    <Block position={[-l / 2 + (l * 0.38 - 0.85) / 2, e + 1.2, -w * 0.15]} size={[Math.max(0.25, l * 0.38 - 0.85), 2.4, 0.12]} color="#ded7c7" />
    <Block position={[-l / 2 + 0.66, e + 0.1, -w / 2 + 0.7]} size={[1.1, 0.12, 1.15]} color="#c3c3b6" />
    <Glass position={[-l / 2 + 1.22, e + 1.05, -w / 2 + 0.7]} size={[0.025, 2, 1.15]} />
    <Block position={[-l * 0.12 - 0.45, e + 0.42, -w / 2 + 0.4]} size={[0.68, 0.84, 0.55]} color="#a58d68" />
    {/* Terrace is outside the enclosed footprint and follows its own controls. */}
    <Block position={[0, e - 0.09, w / 2 + td / 2]} size={[tw, 0.18, td]} color={wood} />
    {Array.from({ length: Math.ceil(tw / 0.16) }, (_, i) => <Block key={`deck-${i}`} position={[-tw / 2 + (i + 0.5) * tw / Math.ceil(tw / 0.16), e + 0.015, w / 2 + td / 2]} size={[tw / Math.ceil(tw / 0.16) - 0.01, 0.03, td]} color={accent} />)}
    {[-tw / 2 + 0.1, tw / 2 - 0.1].map((x) => <group key={`terrace-${x}`}>
      <Block position={[x, (e - 0.18) / 2, terraceFront - 0.1]} size={[0.13, e - 0.18, 0.13]} color={trim} />
      <Beam start={[x, e + 1.03, w / 2]} end={[x, e + 1.03, terraceFront]} color={trim} />
      {[0.1, td / 2, td - 0.1].map((z) => <Beam key={z} start={[x, e + 0.02, w / 2 + z]} end={[x, e + 1.03, w / 2 + z]} radius={0.019} color={trim} />)}
    </group>)}
    <Beam start={[stairX + 0.6, e + 1.03, terraceFront - 0.05]} end={[tw / 2 - 0.1, e + 1.03, terraceFront - 0.05]} color={trim} />
    <Beam start={[tw / 2 - 0.1, e + 0.02, terraceFront - 0.05]} end={[tw / 2 - 0.1, e + 1.03, terraceFront - 0.05]} color={trim} />
    {Array.from({ length: stepCount }, (_, i) => {
      const stepY = e * (stepCount - i) / stepCount
      const stepZ = terraceFront + tread * (i + 0.5)
      return <Block key={`step-${i}`} position={[stairX, stepY - 0.045, stepZ]} size={[1.1, 0.09, tread + 0.015]} color={accent} />
    })}
    {[-0.55, 0.55].map((x) => <group key={`rail-${x}`}>
      <Beam start={[stairX + x, e - 0.1, terraceFront]} end={[stairX + x, 0.02, terraceFront + stepCount * tread]} radius={0.055} color={trim} />
      <Beam start={[stairX + x, e + 1.03, terraceFront]} end={[stairX + x, 1.03, terraceFront + stepCount * tread]} color={trim} />
      {[0, 0.5, 1].map((f) => <Beam key={f} start={[stairX + x, e * (1 - f), terraceFront + stepCount * tread * f]} end={[stairX + x, e * (1 - f) + 1.03, terraceFront + stepCount * tread * f]} radius={0.02} color={trim} />)}
    </group>)}
    {/* The car is a visual parking reference, not a verified clearance study. */}
    <group position={[l * 0.16, 0, 0]}>
      <Block position={[0, 0.54, 0]} size={[3.95, 0.58, 1.72]} color="#c8c5b9" />
      <Block position={[-0.2, 1.04, 0]} size={[2.05, 0.55, 1.5]} color="#a7b7af" />
      <Block position={[-0.2, 1.35, 0]} size={[2.08, 0.06, 1.53]} color="#c8c5b9" />
      {[-1.26, 1.25].flatMap((x) => [-0.85, 0.85].map((z) => <mesh key={`${x}-${z}`} position={[x, 0.32, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.15, 16]} />
        <meshStandardMaterial color="#353934" roughness={0.95} />
      </mesh>))}
      {[-0.55, 0.55].map((z) => <Block key={`light-${z}`} position={[1.985, 0.64, z]} size={[0.025, 0.15, 0.35]} color="#f3edcd" />)}
    </group>
  </group>
}

function Landscape() {
  return <group>
    <mesh position={[0, -0.12, 0]} receiveShadow>
      <cylinderGeometry args={[12.3, 12.5, 0.2, 64]} />
      <meshStandardMaterial color="#b9c1a6" roughness={1} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 1]} receiveShadow>
      <planeGeometry args={[11, 11]} />
      <meshStandardMaterial color="#bfc3ad" roughness={1} />
    </mesh>
    {[[-7.5, 0, -3, 1.35], [-5.5, 0, -6.8, 1.1], [-1.2, 0, -7.6, 1.4], [4.8, 0, -6.9, 1.2], [7.6, 0, -3.8, 1.05], [-8.5, 0, 2.3, 0.85], [8.8, 0, 2.2, 0.8]].map(([x, y, z, s], i) => <Tree key={i} position={[x, y, z]} scale={s} shade={i % 2 ? '#718067' : '#65765b'} />)}
    {[[-6, 0.1, 3], [-5.6, 0.12, 3.4], [5.8, 0.1, 3], [6.2, 0.12, 2.5], [-3.5, 0.08, 7.8], [3.9, 0.1, 6.5]].map(([x, y, z], i) => <mesh key={i} position={[x, y, z]} scale={[0.7, 0.4, 0.5]} castShadow>
      <icosahedronGeometry args={[0.6, 0]} />
      <meshStandardMaterial color={i % 2 ? '#909b7b' : '#899578'} roughness={1} />
    </mesh>)}
    {[0, 1, 2, 3].map((i) => <Block key={`path-${i}`} position={[-1, 0.025, 8.1 + i * 0.65]} size={[0.9, 0.04, 0.43]} color="#c7c5b6" />)}
  </group>
}

function CameraRig({ view, revision, design }: { view: View; revision: number; design: CabinDesign }) {
  const { camera, invalidate } = useThree()
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  useEffect(() => {
    const distance = Math.max(design.length, design.width + design.terraceDepth, 9) * 1.75
    const target: Point = [0, design.elevation + 1, 0.8]
    const positions: Record<View, Point> = {
      Perspective: [distance * 0.8, distance * 0.64, distance],
      Front: [0, design.elevation + 2.8, distance * 1.2],
      Rear: [-distance * 0.35, design.elevation + 3.5, -distance * 1.1],
      Aerial: [0.01, distance * 1.5, 0.8],
    }
    camera.position.set(...positions[view])
    camera.lookAt(...target)
    if (controls.current) {
      controls.current.target.set(...target)
      controls.current.update()
    }
    invalidate()
  }, [view, revision, design.length, design.width, design.terraceDepth, design.elevation, camera, invalidate])
  return <OrbitControls ref={controls} makeDefault minDistance={5} maxDistance={45} minPolarAngle={0.02} maxPolarAngle={Math.PI / 2 - 0.025} enableDamping dampingFactor={0.08} />
}

function ConceptFallback({ design }: { design: CabinDesign }) {
  const palette = palettes[design.finish]
  return <div role="status" style={{ minHeight: 450, height: '100%', display: 'grid', alignContent: 'center', padding: 32, textAlign: 'center' }}>
    <svg viewBox="0 0 580 360" role="img" aria-label="Illustration of the elevated cabin concept" style={{ width: '100%', maxWidth: 620, margin: 'auto' }}>
      <ellipse cx="285" cy="305" rx="260" ry="34" fill="#cad1bc" />
      <path d="M68 260V120m-22 0 22-47 22 47m-37 11 15-31 15 31M505 260V114m-22 0 22-47 22 47m-37 11 15-31 15 31" fill="#829171" stroke="#728466" strokeWidth="9" />
      <path d="m147 156 219-33 89 43-218 40z" fill={palette.trim} />
      <path d="m147 156 90 50v69l-90-50z" fill={palette.wood} />
      <path d="m237 206 218-40v70l-218 39z" fill={palette.accent} />
      <path d="m290 201 154-28v57l-154 28z" fill="#96aaa0" stroke={palette.trim} strokeWidth="5" />
      <path d="m345 191 1 58m48-66 1 57" stroke={palette.trim} strokeWidth="4" />
      <path d="m147 225 90 50 218-39m-294-3v58m76-16v49m203-86v58m-109-38v49" stroke={palette.trim} strokeWidth="8" fill="none" />
      <path d="m285 266 54 23 96-17-55-24z" fill={palette.wood} />
      <path d="m338 289-30 35m-5-6 22 3m-18-10 23 3m-18-10 23 3m-18-10 23 3" stroke={palette.trim} strokeWidth="5" />
      <path d="m285 266v-24l54 23 96-17v24m-96 17v-24" stroke={palette.trim} strokeWidth="3" fill="none" />
    </svg>
    <p style={{ color: '#4b5f50', fontSize: 13, margin: '12px 0 0' }}>3D rendering is unavailable in this browser. Your design controls and floor plan still work.</p>
  </div>
}

class SceneBoundary extends Component<{ children: ReactNode; design: CabinDesign }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <ConceptFallback design={this.props.design} /> : this.props.children }
}

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2')
    if (!context) return false
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch { return false }
}

export default function CabinScene({ design }: { design: CabinDesign }) {
  const [view, setView] = useState<View>('Perspective')
  const [revision, setRevision] = useState(0)
  const [webgl] = useState(supportsWebGL)
  return <div data-testid="cabin-canvas" style={{ position: 'relative', minHeight: 480, height: '100%', width: '100%', background: '#e5e8dd', overflow: 'hidden' }}>
    <SceneBoundary design={design}>
      {webgl ? <Canvas aria-label="Interactive cabin model" frameloop="demand" shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 1.5]} camera={{ position: [13, 10, 16], fov: 42, near: 0.1, far: 100 }} gl={{ antialias: true, powerPreference: 'high-performance' }} style={{ minHeight: 480 }}>
        <color attach="background" args={['#e5e8dd']} />
        <fog attach="fog" args={['#e5e8dd', 32, 65]} />
        <ambientLight intensity={1.15} />
        <hemisphereLight args={['#fbf8ea', '#7b8868', 1.35]} />
        <directionalLight position={[8, 15, 8]} intensity={2.7} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-15} shadow-camera-right={15} shadow-camera-top={15} shadow-camera-bottom={-15} shadow-normalBias={0.04} shadow-bias={-0.0002} />
        <directionalLight position={[-10, 6, -8]} intensity={0.5} color="#e7eddf" />
        <Landscape />
        <Cabin design={design} />
        <CameraRig view={view} revision={revision} design={design} />
      </Canvas> : <ConceptFallback design={design} />}
    </SceneBoundary>
    <div aria-label="Camera views" role="group" style={{ position: 'absolute', left: 20, bottom: 20, display: 'flex', gap: 4, padding: 4, borderRadius: 9, background: '#f8f7efed', boxShadow: '0 2px 14px #263f3210', flexWrap: 'wrap', maxWidth: 'calc(100% - 40px)' }}>
      {(['Perspective', 'Front', 'Rear', 'Aerial'] as View[]).map((name) => <button key={name} type="button" disabled={!webgl} aria-label={`${name} camera view`} aria-pressed={view === name} onClick={() => { setView(name); setRevision((value) => value + 1) }} style={{ border: 0, padding: '8px 11px', borderRadius: 6, cursor: webgl ? 'pointer' : 'default', font: 'inherit', fontSize: 11, color: view === name ? '#fff' : '#52604f', background: view === name ? '#354b3a' : 'transparent', opacity: webgl ? 1 : 0.65 }}>{name}</button>)}
    </div>
    {webgl && <div style={{ position: 'absolute', right: 20, bottom: 28, fontSize: 10, color: '#64715e', pointerEvents: 'none' }}>Drag to orbit · Scroll to zoom</div>}
  </div>
}
