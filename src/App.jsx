import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { sound } from './audio';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const actTwoRef = useRef(null);
  const horizontalTrackRef = useRef(null);
  const actThreeRef = useRef(null);
  const actFourRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // 1. Initialize Lenis Inertia Scrolling
    const lenis = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 0.9,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // 2. Cursor Coordinates & 3D Perspective Tilt
    const handlePointerMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;

      document.documentElement.style.setProperty('--cursor-x', `${x}px`);
      document.documentElement.style.setProperty('--cursor-y', `${y}px`);

      const normX = (x / window.innerWidth - 0.5) * 2;
      const normY = (y / window.innerHeight - 0.5) * 2;

      gsap.to('.panel-board', {
        rotationY: normX * 14,
        rotationX: -normY * 14,
        transformPerspective: 800,
        transformOrigin: 'center center',
        duration: 0.3,
        ease: 'power1.out',
      });

      gsap.to('.sfx-burst', {
        x: normX * 22,
        y: normY * 22,
        duration: 0.2,
        ease: 'power1.out',
      });
    };

    window.addEventListener('pointermove', handlePointerMove);

    // 3. GSAP Choreography
    const ctx = gsap.context(() => {
      // Act I: Panel Slam In
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stageRef.current,
          start: 'top top',
          end: '+=2200',
          scrub: 1,
          pin: true,
        },
      });

      tl.from('.panel-left', {
        xPercent: -150,
        rotate: -12,
        opacity: 0,
        ease: 'power2.out',
      })
      .from('.panel-right', {
        xPercent: 150,
        rotate: 10,
        opacity: 0,
        ease: 'power2.out',
      }, '<0.2')
      .from('.panel-bottom', {
        yPercent: 120,
        scale: 0.8,
        opacity: 0,
        ease: 'back.out(1.5)',
        onStart: () => sound.playImpact(),
      }, '<0.3')
      .from('.sfx-burst', {
        scale: 0,
        rotate: -20,
        opacity: 0,
        ease: 'elastic.out(1, 0.4)',
      }, '>-0.1');

      // Act II: Horizontal Pan Scoped strictly to Panels 04 & 05
      const track = horizontalTrackRef.current;
      const scrollDist = track.scrollWidth - window.innerWidth;

      const actTwoTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: actTwoRef.current,
          start: 'top top',
          end: () => `+=${scrollDist + 800}`,
          scrub: 1,
          pin: true,
          invalidateOnRefresh: true,
        },
      });

      actTwoTimeline.to(track, {
        x: -scrollDist,
        ease: 'none',
      });

      actTwoTimeline.fromTo(
        '.sfx-fwip',
        { scale: 0, rotate: -45, opacity: 0 },
        {
          scale: 1,
          rotate: -8,
          opacity: 1,
          ease: 'back.out(2.5)',
          onStart: () => sound.playSwoosh(),
        },
        0.45
      );

      actTwoTimeline.fromTo(
        '.sfx-crack',
        { scale: 0, rotate: 35, opacity: 0 },
        {
          scale: 1.25,
          rotate: 12,
          opacity: 1,
          ease: 'elastic.out(1, 0.4)',
          onStart: () => sound.playImpact(),
        },
        0.75
      );

      gsap.to('.bg-parallax-layer', {
        x: -scrollDist * 0.4,
        ease: 'none',
        scrollTrigger: {
          trigger: actTwoRef.current,
          start: 'top top',
          end: () => `+=${scrollDist + 800}`,
          scrub: 1,
        },
      });

      // Act III: Panel 06 Vertical Pinned Inspection Stage
      const actThreeTl = gsap.timeline({
        scrollTrigger: {
          trigger: actThreeRef.current,
          start: 'top top',
          end: '+=1800',
          scrub: 1,
          pin: true,
        },
      });

      actThreeTl.from('.panel-evidence-inspect', {
        yPercent: 130,
        scale: 0.85,
        opacity: 0,
        ease: 'back.out(1.4)',
        onStart: () => sound.playImpact(),
      })
      .from('.evidence-badge-tag', {
        scale: 0,
        rotate: -15,
        opacity: 0,
        ease: 'elastic.out(1, 0.5)',
      }, '-=0.2');

      // Act IV: The Katana Slash & Screen Split Climax
      const actFourTl = gsap.timeline({
        scrollTrigger: {
          trigger: actFourRef.current,
          start: 'top top',
          end: '+=2400',
          scrub: 1,
          pin: true,
        },
      });

      actFourTl.from('.slash-standoff-top', {
        xPercent: -100,
        opacity: 0,
        duration: 0.3,
      })
      .from('.slash-standoff-bottom', {
        xPercent: 100,
        opacity: 0,
        duration: 0.3,
      }, '<0.1')
      .fromTo(
        '.slash-laser-line',
        { scaleX: 0, opacity: 0 },
        {
          scaleX: 1,
          opacity: 1,
          duration: 0.1,
          ease: 'power4.inOut',
          onStart: () => sound.playBlade(),
        }
      )
      .to('.slice-top-container', {
        xPercent: -8,
        yPercent: -6,
        duration: 0.5,
        ease: 'power3.out',
      }, '+=0.05')
      .to('.slice-bottom-container', {
        xPercent: 8,
        yPercent: 6,
        duration: 0.5,
        ease: 'power3.out',
      }, '<')
      .fromTo(
        '.sfx-zraash',
        { scale: 0, rotate: -25, opacity: 0 },
        {
          scale: 1.3,
          rotate: -6,
          opacity: 1,
          ease: 'elastic.out(1, 0.3)',
          duration: 0.4,
          onStart: () => sound.playImpact(),
        },
        '-=0.3'
      );

    }, containerRef);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      lenis.destroy();
      ctx.revert();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-noir-bg text-white selection:bg-noir-accent font-mono">
      {/* Audio Toggle HUD */}
      <button
        onClick={() => {
          const muted = sound.toggleMute();
          setIsMuted(muted);
          if (!muted) sound.playClick();
        }}
        className="fixed top-6 right-6 z-50 border border-neutral-700 bg-black/80 px-3 py-1 text-[11px] font-mono tracking-widest uppercase hover:border-red-500 transition-colors shadow-lg"
      >
        AUDIO: <span className={isMuted ? 'text-red-500' : 'text-green-400'}>{isMuted ? 'MUTED' : 'ENABLED'}</span>
      </button>

      {/* Dynamic Flashlight Mask Layer */}
      <div 
        className="pointer-events-none fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(circle 420px at var(--cursor-x, 50vw) var(--cursor-y, 50vh), rgba(255, 42, 42, 0.12) 0%, rgba(0, 0, 0, 0.6) 65%, rgba(10, 10, 12, 0.92) 100%)',
        }}
      />

      {/* Intro Header */}
      <header className="flex h-screen flex-col items-center justify-center p-6 text-center">
        <p className="text-xs tracking-[0.4em] text-red-500 uppercase">Case File // 001</p>
        <h1 className="mt-4 text-5xl md:text-8xl font-black tracking-tighter uppercase italic">
          Shadow &amp; Ink
        </h1>
        <p className="mt-6 text-sm text-neutral-400">Scroll down to inspect the crime scene &darr;</p>
      </header>

      {/* Act I: Pinned Comic Stage */}
      <section 
        ref={stageRef} 
        className="relative h-screen w-full overflow-hidden flex items-center justify-center"
        style={{ perspective: '1000px' }}
      >
        <div className="panel-board relative w-full max-w-5xl h-[80vh] p-4 flex flex-col justify-between">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[60%]">
            <div className="panel-left relative border-2 border-white/80 bg-noir-panel p-6 shadow-2xl flex flex-col justify-between overflow-hidden">
              <span className="text-[10px] tracking-widest text-neutral-400">PANEL 01 // 23:42 HRS</span>
              <p className="text-xl font-bold uppercase tracking-tight">The rain hit the alley like shattered glass.</p>
              <div className="h-1 w-12 bg-red-600" />
            </div>

            <div className="panel-right relative border-2 border-white/80 bg-noir-panel p-6 shadow-2xl flex flex-col justify-between overflow-hidden">
              <span className="text-[10px] tracking-widest text-neutral-400">PANEL 02 // ALLEYWAY</span>
              <p className="text-xl font-bold uppercase tracking-tight">No footprints. Just an empty blade and severed cables.</p>
              <div className="h-1 w-12 bg-white" />
            </div>
          </div>

          <div className="panel-bottom relative h-[35%] border-2 border-white/80 bg-noir-panel p-6 shadow-2xl flex items-center justify-between overflow-hidden">
            <div>
              <span className="text-[10px] tracking-widest text-red-500">SUBJECT SPOTTED</span>
              <h2 className="text-2xl md:text-4xl font-black tracking-tight uppercase">&ldquo;He didn&apos;t run. He vanished.&rdquo;</h2>
            </div>

            <div className="sfx-burst absolute right-6 -bottom-2 bg-red-600 text-white font-black text-3xl md:text-5xl px-4 py-2 border-2 border-white transform rotate-3 shadow-[4px_4px_0px_#ffffff]">
              SHRRK!
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="h-[40vh] flex flex-col items-center justify-center border-y border-neutral-800 text-center px-4">
        <span className="text-xs text-red-500 tracking-[0.3em] uppercase">Pursuit Commenced</span>
        <h3 className="text-2xl md:text-3xl font-extrabold uppercase mt-2">Traversing Sector 9 Rooftops</h3>
      </div>

      {/* Act II: Horizontal Pan */}
      <section ref={actTwoRef} className="relative h-screen w-full overflow-hidden bg-black">
        <div className="bg-parallax-layer pointer-events-none absolute inset-y-0 left-0 w-[200vw] opacity-25 flex items-end">
          <div className="h-[70%] w-full bg-[repeating-linear-gradient(90deg,#16161a_0px,#16161a_40px,#09090c_40px,#09090c_80px)]" />
        </div>

        <div ref={horizontalTrackRef} className="flex h-full w-[170vw] items-center px-12 gap-8 relative z-10">
          <div className="w-[60vw] h-[70vh] border-2 border-white/70 bg-[#0e0e12] p-8 flex flex-col justify-between shrink-0 shadow-2xl">
            <span className="text-xs text-neutral-400">PANEL 04 // ROOFTOP LEDGE</span>
            <p className="text-3xl font-black uppercase max-w-md leading-tight">
              A shadow skips across neon antennas. Fast. Preternaturally fast.
            </p>
            <div className="border-t border-neutral-800 pt-4 flex justify-between text-xs text-neutral-500">
              <span>WIND SPEED: 34 KNOTS</span>
              <span className="text-red-500">TARGET RANGE: 420M</span>
            </div>
          </div>

          <div className="w-[85vw] h-[70vh] border-2 border-red-600 bg-[#0a0a0d] p-8 flex flex-col justify-between shrink-0 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 text-[10rem] font-black text-red-600/10 select-none">
              LEAP
            </div>
            
            <div className="sfx-fwip absolute left-8 top-16 bg-white text-black font-black text-4xl md:text-6xl px-4 py-2 border-2 border-black shadow-[6px_6px_0px_#ff2a2a] z-20">
              FWIP!
            </div>

            <div className="sfx-crack absolute right-16 bottom-16 bg-red-600 text-white font-black text-5xl md:text-8xl px-6 py-2 border-2 border-white shadow-[8px_8px_0px_#ffffff] z-20">
              CRACK!
            </div>

            <span className="text-xs text-red-500">PANEL 05 // THE LEAP</span>
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">
                &ldquo;You're tracking a ghost, Officer.&rdquo;
              </h2>
              <p className="text-sm text-neutral-400 mt-4 leading-relaxed">
                The silhouette pivots mid-air, grappling wire snapping taut against the radio spire.
              </p>
            </div>
            <div className="flex gap-4">
              <span className="bg-white text-black px-3 py-1 font-black text-xs uppercase">EVIDENCE #092 DROPPED</span>
              <span className="bg-red-600 text-white px-3 py-1 font-black text-xs uppercase">SIGNAL LOST</span>
            </div>
          </div>
        </div>
      </section>

      {/* Act III: Panel 06 Vertical Pinned Inspection Stage */}
      <section 
        ref={actThreeRef} 
        className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-black border-t border-neutral-900"
        style={{ perspective: '1000px' }}
      >
        <div className="relative w-full max-w-5xl h-[75vh] p-4 flex flex-col justify-center">
          <div className="panel-evidence-inspect relative border-2 border-white/80 bg-noir-panel p-8 md:p-12 shadow-2xl flex flex-col justify-between overflow-hidden min-h-[50vh]">
            <div>
              <span className="text-xs tracking-widest text-neutral-400">PANEL 06 // THE FIRE ESCAPE GRATE</span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mt-3">
                A single silver cartridge falls into the shadows below.
              </h2>
              <p className="text-sm text-neutral-400 mt-4 max-w-xl leading-relaxed">
                Recovered from the rain-slicked fire escape ironwork. Biometric telemetry indicates it was deliberately ejected during the grapple jump.
              </p>
            </div>

            <div 
              onClick={() => {
                sound.playClick();
                setIsModalOpen(true);
              }}
              className="mt-8 cursor-pointer group border-2 border-dashed border-red-500/80 hover:border-red-500 bg-red-950/20 hover:bg-red-950/40 p-5 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-red-600 animate-ping" />
                <span className="text-sm md:text-base font-bold text-red-400 group-hover:text-red-300 uppercase">
                  [Click to Inspect Evidence #092]
                </span>
              </div>
              <span className="text-sm text-neutral-300 font-mono tracking-widest group-hover:translate-x-1 transition-transform">
                OPEN DOCKET &rarr;
              </span>
            </div>

            <div className="evidence-badge-tag absolute right-6 -bottom-3 bg-white text-black font-black text-2xl md:text-3xl px-4 py-1 border-2 border-black transform -rotate-2 shadow-[4px_4px_0px_#ff2a2a]">
              CRIME SCENE ITEM
            </div>
          </div>
        </div>
      </section>

      {/* Act IV: The Climax Katana Slash Section */}
      <section 
        ref={actFourRef} 
        className="relative h-screen w-full overflow-hidden bg-black flex items-center justify-center border-t border-neutral-900"
      >
        {/* Extreme Close-Up Eye Standoff Layer */}
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 pointer-events-none">
          <div className="slash-standoff-top border-b-2 border-white/60 bg-[#0d0d10] p-4 flex justify-between items-center max-w-xl">
            <span className="text-xs text-red-500">CONFRONTATION // 00:03 SEC</span>
            <span className="text-xs text-neutral-400 font-mono tracking-widest">&ldquo;DON&apos;T MOVE.&rdquo;</span>
          </div>

          <div className="slash-standoff-bottom self-end border-t-2 border-red-600 bg-[#0d0d10] p-4 flex justify-between items-center max-w-xl">
            <span className="text-xs text-neutral-400 font-mono tracking-widest">&ldquo;TOO LATE.&rdquo;</span>
            <span className="text-xs text-red-500">BLADE DRAW SPEED: 0.12S</span>
          </div>
        </div>

        {/* Diagonal Katana Slash Laser Beam */}
        <div 
          className="slash-laser-line pointer-events-none absolute w-[140vw] h-1.5 bg-white shadow-[0_0_25px_#ff2a2a,0_0_50px_#ffffff] z-30 transform -rotate-[3.5deg] origin-center"
        />

        {/* Top Half Layer */}
        <div className="slice-top-container slice-top absolute inset-0 bg-[#08080a] flex flex-col justify-center items-center p-8 z-20 select-none">
          <span className="text-xs text-red-500 tracking-[0.4em] uppercase font-bold mb-4">FINAL VERDICT</span>
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-white text-center">
            STEEL MEETS SHADOW
          </h2>
          <p className="text-sm md:text-lg font-bold uppercase tracking-widest text-neutral-500 mt-6">
            THE OPERATIVE SLIPS INTO THE RAIN
          </p>
        </div>

        {/* Bottom Half Layer */}
        <div className="slice-bottom-container slice-bottom absolute inset-0 bg-[#08080a] flex flex-col justify-center items-center p-8 z-20 select-none">
          <span className="text-xs text-red-500 tracking-[0.4em] uppercase font-bold mb-4">FINAL VERDICT</span>
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-neutral-300 text-center">
            STEEL MEETS SHADOW
          </h2>
          <p className="text-sm md:text-lg font-bold uppercase tracking-widest text-neutral-500 mt-6">
            THE OPERATIVE SLIPS INTO THE RAIN
          </p>
        </div>

        {/* Climax Impact SFX Callout */}
        <div className="sfx-zraash absolute z-40 bg-red-600 text-white font-black text-5xl md:text-8xl px-8 py-3 border-4 border-white shadow-[10px_10px_0px_#ffffff] transform -rotate-6 pointer-events-none">
          ZRAAASH!
        </div>
      </section>

      {/* Forensic Inspection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-xl border-2 border-red-600 bg-[#0d0d10] p-6 shadow-[0px_0px_50px_rgba(255,42,42,0.3)]">
            <button 
              onClick={() => {
                sound.playClick();
                setIsModalOpen(false);
              }}
              className="absolute top-4 right-4 text-xs font-mono uppercase bg-red-600 px-3 py-1 hover:bg-red-500 text-white font-bold"
            >
              [Close X]
            </button>

            <span className="text-xs text-red-500 tracking-widest uppercase">Forensic Analysis Unit</span>
            <h3 className="text-2xl font-black uppercase tracking-tight mt-1">Decrypted Silver Cartridge</h3>

            <div className="my-6 border-y border-neutral-800 py-4 space-y-2 text-xs text-neutral-300">
              <div className="flex justify-between">
                <span className="text-neutral-500">METALLURGY:</span>
                <span className="font-bold text-white">TITANIUM-TUNGSTEN ALLOY</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">SERIAL HASH:</span>
                <span className="font-mono text-red-400">0x7F99B0...E42A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">STORED PAYLOAD:</span>
                <span className="font-bold text-white">CORRUPTED BIOMETRIC RECORD</span>
              </div>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Micro-inscriptions indicate manufacture origin outside registered municipal districts. Firmware contains an automated dead-man cipher wiping memory in 48 hours.
            </p>

            <button 
              onClick={() => {
                sound.playClick();
                setIsModalOpen(false);
              }}
              className="mt-6 w-full border border-white py-2 text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors"
            >
              Acknowledge &amp; Resume Case File
            </button>
          </div>
        </div>
      )}

      {/* Outro Finale Dossier */}
      <footer className="flex h-screen flex-col items-center justify-center p-6 text-center border-t border-neutral-900 bg-black">
        <span className="text-xs tracking-[0.4em] text-red-500 uppercase">Case Status // UNRESOLVED</span>
        <h3 className="mt-4 text-4xl md:text-6xl font-black tracking-tight uppercase">THE GHOST REMAINS</h3>
        <p className="mt-4 text-sm text-neutral-400 max-w-md leading-relaxed">
          You reached the end of the prototype reel. Built with zero pre-rendered video—powered entirely by GPU transforms, Web Audio, and scroll inertia.
        </p>
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="mt-8 border-2 border-white px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
        >
          &uarr; Re-run Case Reel
        </button>
      </footer>
    </div>
  );
}