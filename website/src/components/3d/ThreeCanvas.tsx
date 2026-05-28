'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Float, Html, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { useSoundEffects } from '../../hooks/useSoundEffects'
import WaveformCanvas from '../effects/WaveformCanvas'

type AppState = 'speaking' | 'typing' | 'idle'

const EXAMPLES = [
  {
    title: 'New Message - Outlook',
    text: "Hey team,\n\nI've reviewed the latest design mockups and they look fantastic. Let's proceed with the final presentation.\n\nBest,\nAlex"
  },
  {
    title: 'Notion - Project Notes',
    text: "# Q3 Roadmap Meeting\n\n- Discussed upcoming features\n- Decided to prioritize mobile responsiveness\n- Action items assigned to the engineering team"
  },
  {
    title: 'YouTube - Captions',
    text: "Welcome back to the channel! Today we are going to dive deep into how you can use on-device AI to transcribe your audio completely offline and securely."
  },
  {
    title: 'Messages',
    text: "Hey! Are we still on for dinner tonight at 7? Let me know if you need me to pick up anything on the way there."
  },
  {
    title: 'Word - Legal Document',
    text: "CONFIDENTIALITY AGREEMENT\n\nThis Non-Disclosure Agreement is entered into by and between the undersigned parties to prevent the unauthorized disclosure of Confidential Information."
  }
]

// Colors pulled from WisprType UI
// bg: #161110  |  orange: #F97316  |  orange-light: #FB923C  |  orange-dark: #C2410C

function GlowingMicButton({ isSpeaking, position = [0, 0, 0] }: { isSpeaking: boolean, position?: [number, number, number] }) {
  return (
    <group position={position}>
      <Html center transform position={[0, 0, 0]} scale={0.25}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <div style={{ position: "relative", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>

          {/* Orange ripple rings */}
          {[0, 0.55, 1.1].map((delay, i) => (
            <div key={i} style={{
              position: "absolute",
              width: 80, height: 80,
              borderRadius: "50%",
              border: "1.5px solid rgba(249,115,22,0.8)",
              opacity: 0,
              animation: isSpeaking
                ? `ripple 2s cubic-bezier(0.2,0.6,0.4,1) ${delay}s infinite`
                : "none",
              pointerEvents: "none",
            }} />
          ))}

          {/* Button — orange radial gradient matching WisprType's CTA */}
          <div style={{
            position: "relative",
            width: 60, height: 60,
            borderRadius: "50%",
            background: "radial-gradient(circle at 34% 28%, #fb923c, #c2410c)",
            border: "1.5px solid rgba(251,146,60,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.45s cubic-bezier(0.16,1,0.3,1), box-shadow 0.45s cubic-bezier(0.16,1,0.3,1), opacity 0.35s ease",
            boxShadow: isSpeaking
              ? "inset 0 3px 5px rgba(255,200,100,0.35), inset 0 -4px 7px rgba(0,0,0,0.6), 0 0 18px rgba(249,115,22,0.75), 0 0 44px rgba(249,115,22,0.4)"
              : "inset 0 2px 3px rgba(255,200,100,0.3), inset 0 -3px 5px rgba(0,0,0,0.5), 0 2px 10px rgba(0,0,0,0.6)",
            opacity: isSpeaking ? 1 : 0,
            animation: isSpeaking ? "breathe 1.8s ease-in-out infinite" : "none",
            pointerEvents: "none",
            zIndex: 2,
          }}>
            <svg
              width="26" height="26" viewBox="0 0 24 24"
              fill="none" stroke="rgba(255,255,255,0.95)"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: "absolute", opacity: isSpeaking ? 0 : 1, transition: "opacity 0.3s ease" }}
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" x2="12" y1="19" y2="22"/>
            </svg>

            <div style={{ display: "flex", alignItems: "center", gap: 3, opacity: isSpeaking ? 1 : 0, transition: "opacity 0.3s ease" }}>
              {[
                { delay: "-0.30s", peak: 16 },
                { delay: "-0.10s", peak: 22 },
                { delay:  "0.00s", peak: 20 },
                { delay: "-0.20s", peak: 18 },
                { delay: "-0.45s", peak: 14 },
              ].map((bar, i) => (
                <div key={i} style={{
                  width: 3, height: 5,
                  background: "rgba(255,255,255,0.95)",
                  borderRadius: 2,
                  animation: isSpeaking ? `barBounce 0.9s ease-in-out ${bar.delay} infinite` : "none",
                  ["--peak" as any]: `${bar.peak}px`,
                }} />
              ))}
            </div>
          </div>
          </div>
          
          <div style={{
            opacity: isSpeaking ? 1 : 0,
            transition: "opacity 0.3s ease",
            color: "#FFFFFF",
            fontFamily: "var(--font-heading), sans-serif",
            fontSize: "24px",
            fontWeight: 500,
            letterSpacing: "1px",
            textShadow: "0 2px 12px rgba(249,115,22,0.6)",
            pointerEvents: "none"
          }}>
            Speaking...
          </div>
        </div>

        <style>{`
          @keyframes ripple {
            0%   { transform: scale(1);   opacity: 0.8; }
            100% { transform: scale(2.4); opacity: 0;   }
          }
          @keyframes breathe {
            0%,100% { transform: scale(1.08); box-shadow: inset 0 3px 5px rgba(255,200,100,0.35), inset 0 -4px 7px rgba(0,0,0,0.6), 0 0 16px rgba(249,115,22,0.7), 0 0 38px rgba(249,115,22,0.3); }
            50%      { transform: scale(1.15); box-shadow: inset 0 3px 5px rgba(255,200,100,0.45), inset 0 -4px 7px rgba(0,0,0,0.6), 0 0 28px rgba(249,115,22,0.95), 0 0 60px rgba(249,115,22,0.5); }
          }
          @keyframes barBounce {
            0%,100% { height: 5px;         opacity: 0.55; }
            50%      { height: var(--peak); opacity: 1; }
          }
        `}</style>
      </Html>
    </group>
  );
}

function LaptopScene({ appState, currentExampleIndex }: { appState: AppState, currentExampleIndex: number }) {
  const group = useRef<THREE.Group>(null)
  const { viewport } = useThree()
  
  // Scale up 10%
  const responsiveScale = Math.min(0.277, viewport.width / 19)

  // Rotate slowly based on mouse
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, (state.mouse.x * Math.PI) / 6, 0.05)
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, (state.mouse.y * Math.PI) / 10, 0.05)
    }
  })

  return (
    <group ref={group} position={[0, -0.2, 0]} scale={responsiveScale}>
      {/* Laptop Base */}
      {/* <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 0.1, 3.6]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh> */}
      
      {/* Laptop Keyboard Area */}
      {/* <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[4.6, 0.01, 1.8]} />
        <meshStandardMaterial color="#0d0d0d" />
      </mesh> */}
      {/* Trackpad */}
      {/* <mesh position={[0, 0.06, 1.3]} receiveShadow>
        <boxGeometry args={[1.4, 0.01, 0.8]} />
        <meshStandardMaterial color="#222" />
      </mesh> */}



      {/* Laptop Screen / Hinge */}
      <group position={[0, 0.05, -1.8]} rotation={[-0.1, 0, 0]}>
        {/* Screen Bezel */}
        {/* <mesh position={[0, 1.6, 0]} castShadow>
          <boxGeometry args={[5, 3.2, 0.1]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
        </mesh> */}
        
        {/* Screen Display */}
        <mesh position={[0, 1.6, 0.06]}>
          
          
          <Html 
            transform 
            position={[0, 0, 0.01]} 
            style={{ 
              width: '600px', 
              height: '375px', 
              background: 'rgba(20, 20, 20, 0.65)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: 'none',
              boxSizing: 'border-box',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Windows 11 Title Bar */}
            <div style={{
              height: '40px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingLeft: '16px',
              userSelect: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '13px', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
                <span style={{ fontWeight: 500 }}>{EXAMPLES[currentExampleIndex].title}</span>
              </div>
              <div style={{ display: 'flex', height: '100%' }}>
                {/* Minimize */}
                <div style={{ width: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="10" height="1" viewBox="0 0 10 1"><path d="M0 0h10v1H0z" fill="rgba(255,255,255,0.7)"/></svg>
                </div>
                {/* Maximize */}
                <div style={{ width: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1h8v8H1V1zm1 1v6h6V2H2z" fill="rgba(255,255,255,0.7)"/></svg>
                </div>
                {/* Close */}
                <div style={{ width: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.06 0L5 3.94 8.94 0 10 1.06 6.06 5 10 8.94 8.94 10 5 6.06 1.06 10 0 8.94 3.94 5 0 1.06z" fill="rgba(255,255,255,0.7)"/></svg>
                </div>
              </div>
            </div>

            {/* App Content */}
            <div style={{ padding: '24px', flex: 1, overflow: 'hidden' }}>
              <TypingAnimation appState={appState} currentExampleIndex={currentExampleIndex} />
            </div>

            {/* Real WisprType Overlay Waveform (Small, above bottom edge) */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: `translateX(-50%)`,
              width: '180px',
              height: '40px',
              background: 'rgba(20, 20, 20, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '9999px',
              overflow: 'hidden',
              opacity: appState === 'speaking' ? 1 : 0,
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              pointerEvents: 'none',
              boxShadow: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {appState === 'speaking' && (
                <div style={{ width: '120px', height: '30px' }}>
                  <WaveformCanvas barCount={16} />
                </div>
              )}
            </div>

          </Html>
        </mesh>
      </group>
    </group>
  )
}

function TypingAnimation({ appState, currentExampleIndex }: { appState: AppState, currentExampleIndex: number }) {
  const [text, setText] = useState('')
  const { playTypeSound } = useSoundEffects()
  const currentIndexRef = useRef(0)
  
  const fullText = EXAMPLES[currentExampleIndex].text
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    if (appState === 'speaking') {
      setText('')
      currentIndexRef.current = 0
    } else if (appState === 'typing') {
      const typeNextChar = () => {
        if (currentIndexRef.current < fullText.length) {
          setText(fullText.slice(0, currentIndexRef.current + 1))
          currentIndexRef.current++
          
          timeoutId = setTimeout(typeNextChar, 8 + Math.random() * 15)
        }
      }
      typeNextChar()
    }
    
    return () => clearTimeout(timeoutId)
  }, [appState, playTypeSound, fullText])

  return (
    <>
      <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontFamily: 'Segoe UI, sans-serif', fontSize: '20px', lineHeight: 1.6 }}>
        <div style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
          {text}
          <span style={{ 
            display: 'inline-block', 
            width: '2px', 
            height: '20px', 
            background: '#FFF', 
            marginLeft: '4px',
            verticalAlign: 'middle',
            animation: appState === 'idle' ? 'blink 1s step-end infinite' : 'none',
            opacity: appState === 'speaking' ? 0 : 1
          }} />
        </div>
        
        <style>{`
          @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        `}</style>
      </div>
    </>
  )
}

export default function ThreeCanvas() {
  const [appState, setAppState] = useState<AppState>('speaking')
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    const runSequence = () => {
      // 1. Speaking phase
      setAppState('speaking')
      
      timeoutId = setTimeout(() => {
        // 2. Typing phase
        setAppState('typing')
        
        timeoutId = setTimeout(() => {
          // 3. Idle phase
          setAppState('idle')
          
          timeoutId = setTimeout(() => {
            setCurrentExampleIndex((prev) => (prev + 1) % EXAMPLES.length)
            runSequence() // loop back to speaking
          }, 3500)
        }, 3000)
      }, 4000)
    }
    
    runSequence()
    return () => clearTimeout(timeoutId)
  }, [])

  return (
    <Canvas camera={{ position: [0, 1.3, 7.5], fov: 45 }} dpr={[1, 1.5]} performance={{ min: 0.5 }}>
      <React.Suspense fallback={<Html center style={{ color: '#FF4500', fontFamily: 'monospace' }}>Loading 3D...</Html>}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-10, 10, -5]} intensity={0.5} color="#FF4500" />
        
        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
          <LaptopScene appState={appState} currentExampleIndex={currentExampleIndex} />
        </Float>
        
        {/* 3D Mic Button placed outside the screen and laptop entirely */}
        <GlowingMicButton isSpeaking={appState === 'speaking'} position={[0, -1.2, 1.2]} />
        
        <ContactShadows position={[0, -1.2, 0]} opacity={0.6} scale={15} blur={3} far={5} resolution={256} frames={1} />
      </React.Suspense>
    </Canvas>
  )
}


