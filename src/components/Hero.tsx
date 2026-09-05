'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, Environment, ContactShadows } from '@react-three/drei';
import { Mesh, Group } from 'three';
import Link from 'next/link';

function PremiumShape() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.15;
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1.2} floatIntensity={1.8}>
      <mesh ref={meshRef} scale={2.4}>
        <torusKnotGeometry args={[1, 0.32, 256, 64]} />
        <MeshTransmissionMaterial
          backside
          backsideThickness={0.5}
          thickness={1.6}
          chromaticAberration={0.06}
          anisotropy={1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={2.2}
          resolution={512}
          distortion={0.35}
          distortionScale={0.3}
          temporalDistortion={0.15}
          color="#9333ea"
          roughness={0.1}
          metalness={0.15}
        />
      </mesh>
    </Float>
  );
}

function FloatingNodes() {
  const group = useRef<Group>(null);
  
  useFrame((_state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.08;
    }
  });

  // Spread 8 glowing nodes across a wide orbit so they are clearly visible around the hero text
  const nodes: [number, number, number][] = [
    [-4.6, 2.4, 1.0],
    [4.6, 2.2, 0.8],
    [-5.0, -1.8, 1.4],
    [4.8, -1.6, 1.2],
    [-2.4, 3.2, 0.5],
    [2.6, -3.0, 1.0],
    [-3.8, 0.5, 2.0],
    [3.8, 0.4, -0.8],
  ];

  return (
    <group ref={group}>
      {nodes.map((pos, i) => (
        <Float key={i} speed={1.8 + (i % 3) * 0.4} rotationIntensity={2} floatIntensity={2.5} position={pos}>
          <mesh scale={0.18}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={3} toneMapped={false} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-28 pb-16 overflow-hidden bg-slate-950">
      {/* 3D Background Canvas - Full opacity, high-tech animated backdrop */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 2]}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 10]} intensity={1.5} />
            {/* Neon accent lights to give the torus knot stunning purple & cyan iridescence */}
            <pointLight position={[-6, 3, 4]} intensity={35} color="#8b5cf6" />
            <pointLight position={[6, -3, 4]} intensity={35} color="#06b6d4" />
            <pointLight position={[0, -4, 2]} intensity={20} color="#ec4899" />
            <Environment preset="city" />
            
            <PremiumShape />
            <FloatingNodes />
            
            <ContactShadows position={[0, -3.2, 0]} opacity={0.5} scale={12} blur={2.5} far={5} />
          </Suspense>
        </Canvas>
      </div>

      {/* Hero Content in Standard, Responsive HTML */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pointer-events-none">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-700/50 text-indigo-300 text-sm font-semibold mb-8 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
          Powered by CALL-E Intelligence
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight mb-6 leading-[1.1] text-white drop-shadow-2xl">
          Turn No-Shows <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
            Into Revenue.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 font-normal leading-relaxed drop-shadow-md">
          Clinics lose 15–30% of revenue to missed appointments. RebookRelay recovers it automatically with ultra-realistic AI phone calls.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pointer-events-auto">
          <Link 
            href="/auth/signup" 
            className="group relative px-8 py-4 bg-white text-slate-950 rounded-full font-bold text-base sm:text-lg transition-transform hover:scale-105 inline-block text-center shadow-lg"
          >
            <span className="relative z-10">Start Free Trial</span>
            <div className="absolute inset-0 rounded-full bg-white blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
          </Link>
          <Link 
            href="/auth/login" 
            className="px-8 py-4 bg-slate-900/80 backdrop-blur-md text-white rounded-full font-bold text-base sm:text-lg hover:bg-slate-800 transition-colors border border-slate-700/50 hover:border-slate-500 inline-block text-center"
          >
            Dashboard Login
          </Link>
        </div>
      </div>
    </section>
  );
}
