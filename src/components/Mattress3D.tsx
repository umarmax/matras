import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { Rigidity } from '../types'

export interface Mattress3DProps {
  width?: number
  height?: number
  thickness?: number
  rigidity?: Rigidity
  className?: string
  autoRotate?: boolean
}

interface QuiltedTextures {
  map: THREE.CanvasTexture
  bumpMap: THREE.CanvasTexture
}

function createQuiltedTextures(): QuiltedTextures {
  const size = 256
  const cell = 32

  const colorCanvas = document.createElement('canvas')
  colorCanvas.width = size
  colorCanvas.height = size
  const colorCtx = colorCanvas.getContext('2d')!

  colorCtx.fillStyle = '#f7f2ea'
  colorCtx.fillRect(0, 0, size, size)

  colorCtx.strokeStyle = '#e8dfd0'
  colorCtx.lineWidth = 1.5

  for (let x = 0; x < size; x += cell) {
    for (let y = 0; y < size; y += cell) {
      colorCtx.beginPath()
      colorCtx.moveTo(x + cell / 2, y)
      colorCtx.lineTo(x + cell, y + cell / 2)
      colorCtx.lineTo(x + cell / 2, y + cell)
      colorCtx.lineTo(x, y + cell / 2)
      colorCtx.closePath()
      colorCtx.stroke()
    }
  }

  const bumpCanvas = document.createElement('canvas')
  bumpCanvas.width = size
  bumpCanvas.height = size
  const bumpCtx = bumpCanvas.getContext('2d')!

  bumpCtx.fillStyle = '#808080'
  bumpCtx.fillRect(0, 0, size, size)

  bumpCtx.strokeStyle = '#ffffff'
  bumpCtx.lineWidth = 2

  for (let x = 0; x < size; x += cell) {
    for (let y = 0; y < size; y += cell) {
      bumpCtx.beginPath()
      bumpCtx.moveTo(x + cell / 2, y)
      bumpCtx.lineTo(x + cell, y + cell / 2)
      bumpCtx.lineTo(x + cell / 2, y + cell)
      bumpCtx.lineTo(x, y + cell / 2)
      bumpCtx.closePath()
      bumpCtx.stroke()
    }
  }

  const map = new THREE.CanvasTexture(colorCanvas)
  map.wrapS = map.wrapT = THREE.RepeatWrapping
  map.repeat.set(2, 2)

  const bumpMap = new THREE.CanvasTexture(bumpCanvas)
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping
  bumpMap.repeat.set(2, 2)

  return { map, bumpMap }
}

interface MattressMeshProps {
  width: number
  height: number
  thickness: number
  rigidity: Rigidity
  autoRotate: boolean
}

function MattressMesh({
  width,
  height,
  thickness,
  rigidity,
  autoRotate,
}: MattressMeshProps) {
  const groupRef = useRef<THREE.Group>(null)
  const targetScaleY = useRef(1)
  const currentScaleY = useRef(1)
  const [hovered, setHovered] = useState(false)

  const textures = useMemo(() => createQuiltedTextures(), [])

  useEffect(() => {
    return () => {
      textures.map.dispose()
      textures.bumpMap.dispose()
    }
  }, [textures])

  const handlePointerDown = () => {
    if (rigidity !== 'soft') return
    targetScaleY.current = 0.88
  }

  const handlePointerUp = () => {
    if (rigidity !== 'soft') return
    targetScaleY.current = 1
  }

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.35
    }

    const stiffness = rigidity === 'soft' ? 0.18 : 0.28
    currentScaleY.current +=
      (targetScaleY.current - currentScaleY.current) * stiffness

    if (groupRef.current) {
      groupRef.current.scale.y = currentScaleY.current
    }
  })

  const cornerRadius = Math.min(thickness * 0.25, 0.08)

  return (
    <group ref={groupRef}>
      <RoundedBox
        args={[width, thickness, height]}
        radius={cornerRadius}
        smoothness={4}
        castShadow
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          map={textures.map}
          bumpMap={textures.bumpMap}
          bumpScale={0.015}
          color={hovered ? '#ffffff' : '#faf7f2'}
          roughness={0.82}
          metalness={0.02}
        />
      </RoundedBox>

      <ContactShadows
        position={[0, -thickness / 2 - 0.02, 0]}
        opacity={0.35}
        scale={Math.max(width, height) * 1.4}
        blur={2.5}
        far={0.9}
        resolution={256}
      />
    </group>
  )
}

function Scene(props: MattressMeshProps) {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight
        position={[4, 6, 3]}
        intensity={0.9}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-far={12}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.001}
      />
      <directionalLight position={[-3, 2, -2]} intensity={0.25} />
      <MattressMesh {...props} />
    </>
  )
}

export function Mattress3D({
  width = 2,
  height = 2.2,
  thickness = 0.35,
  rigidity = 'medium',
  className = '',
  autoRotate = true,
}: Mattress3DProps) {
  const maxDim = Math.max(width, height, thickness)

  return (
    <div className={className}>
      <Canvas
        className="mattress-canvas"
        shadows
        dpr={[1, 1.5]}
        camera={{
          position: [maxDim * 1.6, maxDim * 0.9, maxDim * 2],
          fov: 42,
          near: 0.1,
          far: 50,
        }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      >
        <Scene
          width={width}
          height={height}
          thickness={thickness}
          rigidity={rigidity}
          autoRotate={autoRotate}
        />
      </Canvas>
    </div>
  )
}

export default Mattress3D
