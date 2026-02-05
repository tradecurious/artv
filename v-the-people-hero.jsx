import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text3D, Center, OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Floating letter component with mouse repulsion
function FloatingLetter({ char, position, index }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const mouse3D = useRef(new THREE.Vector3());
  const targetPosition = useRef(new THREE.Vector3(...position));
  const velocity = useRef(new THREE.Vector3());
  
  useFrame(({ mouse, camera }) => {
    if (!meshRef.current) return;
    
    // Convert 2D mouse to 3D position
    mouse3D.current.set(mouse.x * 10, mouse.y * 5, 0);
    
    // Calculate distance from mouse to letter
    const letterPos = meshRef.current.position;
    const distanceToMouse = letterPos.distanceTo(mouse3D.current);
    
    // Repulsion force
    if (distanceToMouse < 5) {
      const repulsionForce = new THREE.Vector3()
        .subVectors(letterPos, mouse3D.current)
        .normalize()
        .multiplyScalar((5 - distanceToMouse) * 0.3);
      
      velocity.current.add(repulsionForce);
    }
    
    // Spring back to original position
    const springForce = new THREE.Vector3()
      .subVectors(targetPosition.current, letterPos)
      .multiplyScalar(0.05);
    
    velocity.current.add(springForce);
    velocity.current.multiplyScalar(0.92); // Damping
    
    // Update position
    meshRef.current.position.add(velocity.current);
    
    // Subtle floating animation
    meshRef.current.position.y += Math.sin(Date.now() * 0.001 + index) * 0.002;
    
    // Rotation
    meshRef.current.rotation.y += 0.01;
  });
  
  return (
    <Text3D
      ref={meshRef}
      font="/fonts/helvetiker_regular.typeface.json"
      size={0.8}
      height={0.2}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {char}
      <meshStandardMaterial
        color={hovered ? "#ffd700" : "#ffffff"}
        metalness={0.8}
        roughness={0.2}
        emissive={hovered ? "#ffd700" : "#444444"}
        emissiveIntensity={hovered ? 0.5 : 0.2}
      />
    </Text3D>
  );
}

// Main V letter with mouse tracking
function VLetter() {
  const meshRef = useRef();
  const targetRotation = useRef({ x: 0, y: 0 });
  
  useFrame(({ mouse }) => {
    if (!meshRef.current) return;
    
    // Mouse-based tilt
    targetRotation.current.y = mouse.x * 0.3;
    targetRotation.current.x = -mouse.y * 0.2;
    
    // Smooth lerp
    meshRef.current.rotation.y += (targetRotation.current.y - meshRef.current.rotation.y) * 0.05;
    meshRef.current.rotation.x += (targetRotation.current.x - meshRef.current.rotation.x) * 0.05;
    
    // Auto rotation
    meshRef.current.rotation.z += 0.002;
  });
  
  return (
    <group ref={meshRef}>
      <Center>
        <Text3D
          font="/fonts/helvetiker_bold.typeface.json"
          size={4}
          height={0.5}
          curveSegments={32}
          bevelEnabled
          bevelThickness={0.1}
          bevelSize={0.05}
          bevelSegments={8}
        >
          V
          <meshStandardMaterial
            color="#d4af37"
            metalness={0.9}
            roughness={0.1}
            emissive="#ffed4e"
            emissiveIntensity={0.3}
            envMapIntensity={2}
          />
        </Text3D>
      </Center>
    </group>
  );
}

// Animated grid floor
function GridFloor() {
  const gridRef = useRef();
  
  useFrame(({ clock }) => {
    if (gridRef.current) {
      gridRef.current.position.z = (clock.getElapsedTime() * 0.5) % 2;
    }
  });
  
  return (
    <group ref={gridRef} position={[0, -5, 0]}>
      <gridHelper args={[50, 50, '#444444', '#222222']} rotation={[0, 0, 0]} />
    </group>
  );
}

// Floating particles
function Particles() {
  const count = 100;
  const particlesRef = useRef();
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return pos;
  }, []);
  
  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#ffd700"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Main scene component
function Scene() {
  const letterPositions = [
    // "the" - positioned to the left
    [-5, 2, 0],   // t
    [-4, 1.5, 0], // h
    [-3, 2, 0],   // e
    
    // "People" - positioned to the right
    [3, 2, 0],    // P
    [4, 1.5, 0],  // e
    [5, 2, 0],    // o
    [6, 1.5, 0],  // p
    [7, 2, 0],    // l
    [8, 1.5, 0],  // e
  ];
  
  const letters = "thePeople".split('');
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 15]} />
      
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffd700" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4444ff" />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={2}
        color="#ffffff"
      />
      
      {/* Main V letter */}
      <VLetter />
      
      {/* Floating letters */}
      {letters.map((char, index) => (
        <FloatingLetter
          key={index}
          char={char}
          position={letterPositions[index]}
          index={index}
        />
      ))}
      
      {/* Environment elements */}
      <GridFloor />
      <Particles />
      
      {/* Environment map for reflections */}
      <Environment preset="city" />
    </>
  );
}

// Main component
export default function VThePeopleHero() {
  return (
    <div style={{ width: '100%', height: '100vh', background: '#000000' }}>
      <Canvas
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        <color attach="background" args={['#0a0a0a']} />
        <fog attach="fog" args={['#0a0a0a', 10, 50]} />
        
        <Scene />
      </Canvas>
      
      {/* Overlay text */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          pointerEvents: 'none',
        }}
      >
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, letterSpacing: '0.1em' }}>
          A CONSTITUTIONAL CONVENTION
        </h2>
        <p style={{ fontSize: '1rem', opacity: 0.7, marginTop: '1rem' }}>
          Celebrating America's Founding Document
        </p>
      </div>
    </div>
  );
}
