"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import type { Mesh } from "three";

function KettlebellModel() {
    const meshRef = useRef<Mesh>(null);

    useFrame((state, delta) => {
        if (meshRef.current) {
            // Smooth, floating rotation
            meshRef.current.rotation.y += delta * 0.5;
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
            meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.3) * 0.2;
        }
    });

    return (
        <group ref={meshRef} scale={1.5}>
            {/* Main Body - Sphere */}
            <mesh position={[0, -0.5, 0]}>
                <sphereGeometry args={[1, 32, 32]} />
                <MeshDistortMaterial
                    color="#ff00ff"
                    emissive="#aa00aa"
                    emissiveIntensity={0.5}
                    roughness={0.2}
                    metalness={0.8}
                    distort={0.2}
                    speed={2}
                />
            </mesh>

            {/* Handle - Torus */}
            <mesh position={[0, 0.6, 0]}>
                <torusGeometry args={[0.6, 0.12, 16, 32]} />
                <meshStandardMaterial
                    color="#00f0ff"
                    emissive="#00a0aa"
                    emissiveIntensity={0.5}
                    roughness={0.2}
                    metalness={1}
                />
            </mesh>

            {/* Handle Connectors */}
            <mesh position={[-0.45, 0.4, 0]} rotation={[0, 0, 0.2]}>
                <cylinderGeometry args={[0.12, 0.15, 0.6, 16]} />
                <meshStandardMaterial color="#00f0ff" metalness={1} roughness={0.2} />
            </mesh>
            <mesh position={[0.45, 0.4, 0]} rotation={[0, 0, -0.2]}>
                <cylinderGeometry args={[0.12, 0.15, 0.6, 16]} />
                <meshStandardMaterial color="#00f0ff" metalness={1} roughness={0.2} />
            </mesh>

            {/* Face Eyes */}
            <mesh position={[-0.3, -0.2, 1.0]}>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshStandardMaterial color="white" />
            </mesh>
            <mesh position={[0.3, -0.2, 1.0]}>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshStandardMaterial color="white" />
            </mesh>

            {/* Pupils */}
            <mesh position={[-0.3, -0.2, 1.12]}>
                <sphereGeometry args={[0.05, 16, 16]} />
                <meshStandardMaterial color="black" />
            </mesh>
            <mesh position={[0.3, -0.2, 1.12]}>
                <sphereGeometry args={[0.05, 16, 16]} />
                <meshStandardMaterial color="black" />
            </mesh>

            {/* Smile */}
            <mesh position={[0, -0.5, 1.0]} rotation={[0, 0, Math.PI]}>
                <torusGeometry args={[0.3, 0.05, 16, 32, Math.PI]} />
                <meshStandardMaterial color="white" />
            </mesh>
        </group>
    );
}

export default function ThreeDKettlebell() {
    return (
        <div className="w-[300px] h-[300px] md:w-[500px] md:h-[500px]">
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#00f0ff" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00ff" />
                <Float
                    speed={2}
                    rotationIntensity={0.5}
                    floatIntensity={1}
                >
                    <KettlebellModel />
                </Float>
            </Canvas>
        </div>
    );
}
