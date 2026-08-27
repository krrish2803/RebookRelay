'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, Environment, ContactShadows, Text } from '@react-three/drei';
import { useRef } from 'react';
import { Mesh } from 'three';
import { motion } from 'framer-motion';
import Link from 'next/link';

function PremiumShape() {
  const meshRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.1;
      meshRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} scale={1.5}>
        <torusKnotGeometry args={[1, 0.3, 256, 64]} />
        <MeshTransmissionMaterial
          backside
          backsideThickness={0.5}
          thickness={1.5}
          chromaticAberration={0.05}
          anisotropy={1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={2}
          resolution={1024}
          distortion={0.5}
          distortionScale={0.3}
          temporalDistortion={0.1}
          color="#8b5cf6"
        />
      </mesh>
    </Float>
  );
}

function FloatingNodes() {
  const group = useRef<any>(null);
  
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <group ref={group}>
      {[...Array(5)].map((_, i) => (
        <Float key={i} speed={1.5} rotationIntensity={2} floatIntensity={3} position={[
          Math.sin((i / 5) * Math.PI * 2) * 3,
          Math.cos((i / 5) * Math.PI * 2) * 2,
          Math.sin((i / 5) * Math.PI) * 2
        ]}>
          <mesh scale={0.2}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2} toneMapped={false} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-slate-950">
      {/* Premium 3D Background Element */}
      <div className="absolute inset-0 z-0 cursor-pointer">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <ambientLight intensity={0.2} />
          <directionalLight position={[10, 10, 10]} intensity={1} />
          <Environment preset="city" />
          
          <PremiumShape />
          <FloatingNodes />
          
          <ContactShadows position={[0, -3, 0]} opacity={0.4} scale={10} blur={2} far={4} />
        </Canvas>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-700/50 text-indigo-300 text-sm font-semibold mb-8 backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
          Powered by CALL-E Intelligence
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.1] text-white drop-shadow-2xl"
        >
          Turn No-Shows <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
            Into Revenue.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-2xl text-slate-300 max-w-3xl mx-auto mb-12 font-medium drop-shadow-md"
        >
          Clinics lose 15–30% of revenue to missed appointments. RebookRelay recovers it automatically with ultra-realistic AI phone calls.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 pointer-events-auto"
        >
          <Link href="/auth/signup" className="group relative w-full sm:w-auto px-8 py-4 bg-white text-slate-950 rounded-full font-bold text-lg transition-transform hover:scale-105 inline-block text-center">
            <span className="relative z-10">Start Free Trial</span>
            <div className="absolute inset-0 rounded-full bg-white blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
          </Link>
          <Link href="/auth/login" className="w-full sm:w-auto px-8 py-4 bg-slate-900/50 backdrop-blur-md text-white rounded-full font-bold text-lg hover:bg-slate-800 transition-colors border border-slate-700/50 hover:border-slate-500 inline-block text-center">
            Dashboard Login
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
