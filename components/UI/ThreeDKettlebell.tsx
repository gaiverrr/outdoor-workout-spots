"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, useDetectGPU } from "@react-three/drei";
import type { Mesh } from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Configuration constants for kettlebell geometry and appearance
const KETTLEBELL_CONFIG = {
  // Overall scale
  scale: 1.5,

  // Main body (sphere)
  body: {
    position: [0, -0.5, 0] as const,
    radius: 1,
    widthSegments: 32,
    heightSegments: 32,
    color: "#ff00ff",
    emissive: "#aa00aa",
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0.8,
    distort: 0.2,
    distortSpeed: 2,
  },

  // Handle (torus)
  handle: {
    position: [0, 0.6, 0] as const,
    majorRadius: 0.6,
    minorRadius: 0.12,
    radialSegments: 16,
    tubularSegments: 32,
    color: "#00f0ff",
    emissive: "#00a0aa",
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 1,
  },

  // Handle connectors (cylinders)
  connectors: {
    left: {
      position: [-0.45, 0.4, 0] as const,
      rotation: [0, 0, 0.2] as const,
    },
    right: {
      position: [0.45, 0.4, 0] as const,
      rotation: [0, 0, -0.2] as const,
    },
    radiusTop: 0.12,
    radiusBottom: 0.15,
    height: 0.6,
    radialSegments: 16,
  },

  // Face elements
  face: {
    eyes: {
      left: { position: [-0.3, -0.2, 1.0] as const },
      right: { position: [0.3, -0.2, 1.0] as const },
      radius: 0.15,
      segments: 16,
    },
    pupils: {
      left: { position: [-0.3, -0.2, 1.12] as const },
      right: { position: [0.3, -0.2, 1.12] as const },
      radius: 0.05,
      segments: 16,
    },
    smile: {
      position: [0, -0.5, 1.0] as const,
      rotation: [0, 0, Math.PI] as const,
      majorRadius: 0.3,
      minorRadius: 0.05,
      radialSegments: 16,
      tubularSegments: 32,
      arc: Math.PI,
    },
  },

  // Animation parameters
  animation: {
    rotationSpeed: {
      y: 0.5,
      xAmplitude: 0.3,
      xFrequency: 0.5,
      zAmplitude: 0.2,
      zFrequency: 0.3,
    },
  },

  // Float component parameters
  float: {
    speed: 2,
    rotationIntensity: 0.5,
    floatIntensity: 1,
  },

  // Lighting
  lighting: {
    ambient: { intensity: 0.5 },
    point1: {
      position: [10, 10, 10] as const,
      intensity: 1,
      color: "#00f0ff",
    },
    point2: {
      position: [-10, -10, -10] as const,
      intensity: 0.5,
      color: "#ff00ff",
    },
  },

  // Camera
  camera: {
    position: [0, 0, 5] as const,
    fov: 45,
  },
} as const;

function KettlebellModel() {
    const meshRef = useRef<Mesh>(null);
    const prefersReducedMotion = useReducedMotion();

    useFrame((state, delta) => {
        if (meshRef.current && !prefersReducedMotion) {
            const config = KETTLEBELL_CONFIG.animation.rotationSpeed;

            // Smooth, floating rotation
            meshRef.current.rotation.y += delta * config.y;
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * config.xFrequency) * config.xAmplitude;
            meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * config.zFrequency) * config.zAmplitude;
        }
    });

    return (
        <group ref={meshRef} scale={KETTLEBELL_CONFIG.scale}>
            {/* Main Body - Sphere */}
            <mesh position={KETTLEBELL_CONFIG.body.position}>
                <sphereGeometry args={[
                    KETTLEBELL_CONFIG.body.radius,
                    KETTLEBELL_CONFIG.body.widthSegments,
                    KETTLEBELL_CONFIG.body.heightSegments
                ]} />
                <MeshDistortMaterial
                    color={KETTLEBELL_CONFIG.body.color}
                    emissive={KETTLEBELL_CONFIG.body.emissive}
                    emissiveIntensity={KETTLEBELL_CONFIG.body.emissiveIntensity}
                    roughness={KETTLEBELL_CONFIG.body.roughness}
                    metalness={KETTLEBELL_CONFIG.body.metalness}
                    distort={KETTLEBELL_CONFIG.body.distort}
                    speed={KETTLEBELL_CONFIG.body.distortSpeed}
                />
            </mesh>

            {/* Handle - Torus */}
            <mesh position={KETTLEBELL_CONFIG.handle.position}>
                <torusGeometry args={[
                    KETTLEBELL_CONFIG.handle.majorRadius,
                    KETTLEBELL_CONFIG.handle.minorRadius,
                    KETTLEBELL_CONFIG.handle.radialSegments,
                    KETTLEBELL_CONFIG.handle.tubularSegments
                ]} />
                <meshStandardMaterial
                    color={KETTLEBELL_CONFIG.handle.color}
                    emissive={KETTLEBELL_CONFIG.handle.emissive}
                    emissiveIntensity={KETTLEBELL_CONFIG.handle.emissiveIntensity}
                    roughness={KETTLEBELL_CONFIG.handle.roughness}
                    metalness={KETTLEBELL_CONFIG.handle.metalness}
                />
            </mesh>

            {/* Handle Connectors */}
            <mesh
                position={KETTLEBELL_CONFIG.connectors.left.position}
                rotation={KETTLEBELL_CONFIG.connectors.left.rotation}
            >
                <cylinderGeometry args={[
                    KETTLEBELL_CONFIG.connectors.radiusTop,
                    KETTLEBELL_CONFIG.connectors.radiusBottom,
                    KETTLEBELL_CONFIG.connectors.height,
                    KETTLEBELL_CONFIG.connectors.radialSegments
                ]} />
                <meshStandardMaterial
                    color={KETTLEBELL_CONFIG.handle.color}
                    metalness={KETTLEBELL_CONFIG.handle.metalness}
                    roughness={KETTLEBELL_CONFIG.handle.roughness}
                />
            </mesh>
            <mesh
                position={KETTLEBELL_CONFIG.connectors.right.position}
                rotation={KETTLEBELL_CONFIG.connectors.right.rotation}
            >
                <cylinderGeometry args={[
                    KETTLEBELL_CONFIG.connectors.radiusTop,
                    KETTLEBELL_CONFIG.connectors.radiusBottom,
                    KETTLEBELL_CONFIG.connectors.height,
                    KETTLEBELL_CONFIG.connectors.radialSegments
                ]} />
                <meshStandardMaterial
                    color={KETTLEBELL_CONFIG.handle.color}
                    metalness={KETTLEBELL_CONFIG.handle.metalness}
                    roughness={KETTLEBELL_CONFIG.handle.roughness}
                />
            </mesh>

            {/* Face Eyes */}
            <mesh position={KETTLEBELL_CONFIG.face.eyes.left.position}>
                <sphereGeometry args={[
                    KETTLEBELL_CONFIG.face.eyes.radius,
                    KETTLEBELL_CONFIG.face.eyes.segments,
                    KETTLEBELL_CONFIG.face.eyes.segments
                ]} />
                <meshStandardMaterial color="white" />
            </mesh>
            <mesh position={KETTLEBELL_CONFIG.face.eyes.right.position}>
                <sphereGeometry args={[
                    KETTLEBELL_CONFIG.face.eyes.radius,
                    KETTLEBELL_CONFIG.face.eyes.segments,
                    KETTLEBELL_CONFIG.face.eyes.segments
                ]} />
                <meshStandardMaterial color="white" />
            </mesh>

            {/* Pupils */}
            <mesh position={KETTLEBELL_CONFIG.face.pupils.left.position}>
                <sphereGeometry args={[
                    KETTLEBELL_CONFIG.face.pupils.radius,
                    KETTLEBELL_CONFIG.face.pupils.segments,
                    KETTLEBELL_CONFIG.face.pupils.segments
                ]} />
                <meshStandardMaterial color="black" />
            </mesh>
            <mesh position={KETTLEBELL_CONFIG.face.pupils.right.position}>
                <sphereGeometry args={[
                    KETTLEBELL_CONFIG.face.pupils.radius,
                    KETTLEBELL_CONFIG.face.pupils.segments,
                    KETTLEBELL_CONFIG.face.pupils.segments
                ]} />
                <meshStandardMaterial color="black" />
            </mesh>

            {/* Smile */}
            <mesh
                position={KETTLEBELL_CONFIG.face.smile.position}
                rotation={KETTLEBELL_CONFIG.face.smile.rotation}
            >
                <torusGeometry args={[
                    KETTLEBELL_CONFIG.face.smile.majorRadius,
                    KETTLEBELL_CONFIG.face.smile.minorRadius,
                    KETTLEBELL_CONFIG.face.smile.radialSegments,
                    KETTLEBELL_CONFIG.face.smile.tubularSegments,
                    KETTLEBELL_CONFIG.face.smile.arc
                ]} />
                <meshStandardMaterial color="white" />
            </mesh>
        </group>
    );
}

export default function ThreeDKettlebell() {
    const gpu = useDetectGPU();
    const prefersReducedMotion = useReducedMotion();
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        // Don't render if user prefers reduced motion
        if (prefersReducedMotion) {
            console.debug('3D kettlebell disabled: user prefers reduced motion');
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShouldRender(false);
            return;
        }

        // Check GPU tier - only render on decent hardware (tier 2+)
        if (gpu.tier < 2) {
            console.debug('3D kettlebell disabled: low GPU tier', gpu.tier);
            setShouldRender(false);
            return;
        }

        setShouldRender(true);
    }, [gpu.tier, prefersReducedMotion]);

    // Don't render on low-end devices or if reduced motion is preferred
    if (!shouldRender) {
        return null;
    }

    return (
        <div className="w-[300px] h-[300px] md:w-[500px] md:h-[500px]">
            <Canvas camera={{ position: KETTLEBELL_CONFIG.camera.position, fov: KETTLEBELL_CONFIG.camera.fov }}>
                <ambientLight intensity={KETTLEBELL_CONFIG.lighting.ambient.intensity} />
                <pointLight
                    position={KETTLEBELL_CONFIG.lighting.point1.position}
                    intensity={KETTLEBELL_CONFIG.lighting.point1.intensity}
                    color={KETTLEBELL_CONFIG.lighting.point1.color}
                />
                <pointLight
                    position={KETTLEBELL_CONFIG.lighting.point2.position}
                    intensity={KETTLEBELL_CONFIG.lighting.point2.intensity}
                    color={KETTLEBELL_CONFIG.lighting.point2.color}
                />
                <Float
                    speed={prefersReducedMotion ? 0 : KETTLEBELL_CONFIG.float.speed}
                    rotationIntensity={prefersReducedMotion ? 0 : KETTLEBELL_CONFIG.float.rotationIntensity}
                    floatIntensity={prefersReducedMotion ? 0 : KETTLEBELL_CONFIG.float.floatIntensity}
                >
                    <KettlebellModel />
                </Float>
            </Canvas>
        </div>
    );
}
