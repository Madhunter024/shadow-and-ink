import React, { useEffect, useRef, useState } from 'react';
import { sound } from './audio';

export default function CartridgeModel() {
  const canvasRef = useRef(null);

  const [isRotatingAuto, setIsRotatingAuto] = useState(true);
  const [activeLayer, setActiveLayer] = useState('ALL'); // 'ALL', 'HULL', 'CORE'
  const [wireColor, setWireColor] = useState('cyan'); // 'cyan', 'amber', 'red'

  // Rotation angles (radians)
  const angles = useRef({ x: 0.35, y: 0.6 });
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });

  // Generate 3D wireframe point & line topology
  const buildGeometry = () => {
    const points = [];
    const lines = [];

    const addPoint = (x, y, z, tag = '') => {
      points.push({ x, y, z, tag });
      return points.length - 1;
    };

    const addLine = (p1, p2, type = 'hull') => {
      lines.push({ p1, p2, type });
    };

    // 1. Structural Rings along the Y-axis
    const numSegments = 16;
    const ringSpecs = [
      { y: -105, r: 18, type: 'nozzle' },
      { y: -90,  r: 28, type: 'cap' },
      { y: -70,  r: 34, type: 'hull' },
      { y: -30,  r: 34, type: 'hull' },
      { y: 0,    r: 34, type: 'hull' },
      { y: 30,   r: 34, type: 'hull' },
      { y: 70,   r: 34, type: 'hull' },
      { y: 90,   r: 26, type: 'base' },
      { y: 105,  r: 16, type: 'base' },
    ];

    const ringIndices = [];

    ringSpecs.forEach((ring) => {
      const currentRing = [];
      for (let i = 0; i < numSegments; i++) {
        const theta = (i / numSegments) * Math.PI * 2;
        const x = Math.cos(theta) * ring.r;
        const z = Math.sin(theta) * ring.r;
        const idx = addPoint(x, ring.y, z);
        currentRing.push(idx);
      }
      // Connect circle loop
      for (let i = 0; i < numSegments; i++) {
        const next = (i + 1) % numSegments;
        addLine(currentRing[i], currentRing[next], ring.type);
      }
      ringIndices.push(currentRing);
    });

    // 2. Longitudinal Rib Lines connecting rings
    for (let r = 0; r < ringIndices.length - 1; r++) {
      // Connect every 2nd or 4th spoke for clean blueprint look
      for (let s = 0; s < numSegments; s += 2) {
        addLine(ringIndices[r][s], ringIndices[r + 1][s], 'rib');
      }
    }

    // 3. Floating Internal Biometric Core Cylinder
    const coreSegments = 8;
    const coreRings = [
      { y: -45, r: 14 },
      { y: 0,   r: 14 },
      { y: 45,  r: 14 },
    ];
    const coreIndices = [];

    coreRings.forEach((cRing) => {
      const ring = [];
      for (let i = 0; i < coreSegments; i++) {
        const theta = (i / coreSegments) * Math.PI * 2;
        const x = Math.cos(theta) * cRing.r;
        const z = Math.sin(theta) * cRing.r;
        const idx = addPoint(x, cRing.y, z, 'core');
        ring.push(idx);
      }
      for (let i = 0; i < coreSegments; i++) {
        addLine(ring[i], ring[(i + 1) % coreSegments], 'core');
      }
      coreIndices.push(ring);
    });

    for (let r = 0; r < coreIndices.length - 1; r++) {
      for (let s = 0; s < coreSegments; s++) {
        addLine(coreIndices[r][s], coreIndices[r + 1][s], 'core');
      }
    }

    // Center Core Diode Pulse Node
    addPoint(0, 0, 0, 'node');

    return { points, lines };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { points, lines } = buildGeometry();

    let animationId;
    const focalLength = 320;

    const render = () => {
      // Handle canvas resolution
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // Auto rotation
      if (isRotatingAuto && !isDragging.current) {
        angles.current.y += 0.008;
      }

      const cosX = Math.cos(angles.current.x);
      const sinX = Math.sin(angles.current.x);
      const cosY = Math.cos(angles.current.y);
      const sinY = Math.sin(angles.current.y);

      // Project 3D points -> 2D Screen
      const projected = points.map((p) => {
        // Rotate around Y
        const x1 = p.x * cosY + p.z * sinY;
        const y1 = p.y;
        const z1 = -p.x * sinY + p.z * cosY;

        // Rotate around X
        const x2 = x1;
        const y2 = y1 * cosX - z1 * sinX;
        const z2 = y1 * sinX + z1 * cosX;

        // 3D Perspective Projection
        const distance = z2 + 400; // Camera distance
        const scale = focalLength / Math.max(10, distance);
        const screenX = width / 2 + x2 * scale;
        const screenY = height / 2 + y2 * scale;

        return {
          x: screenX,
          y: screenY,
          z: z2,
          tag: p.tag,
        };
      });

      // Color scheme palettes
      const colors = {
        cyan: { main: 'rgba(56, 189, 248, ', core: 'rgba(239, 68, 68, ', dim: 'rgba(56, 189, 248, 0.15)' },
        amber: { main: 'rgba(245, 158, 11, ', core: 'rgba(255, 255, 255, ', dim: 'rgba(245, 158, 11, 0.15)' },
        red: { main: 'rgba(239, 68, 68, ', core: 'rgba(255, 255, 255, ', dim: 'rgba(239, 68, 68, 0.15)' },
      }[wireColor];

      // Draw Lines with depth attenuation (closer lines = brighter)
      lines.forEach(({ p1, p2, type }) => {
        // Filtering
        if (activeLayer === 'CORE' && type !== 'core') return;
        if (activeLayer === 'HULL' && type === 'core') return;

        const pt1 = projected[p1];
        const pt2 = projected[p2];

        // Depth cueing
        const avgZ = (pt1.z + pt2.z) / 2;
        const depthAlpha = Math.max(0.12, Math.min(0.9, (avgZ + 120) / 240));

        ctx.beginPath();
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);

        if (type === 'core') {
          ctx.strokeStyle = `${colors.core}${depthAlpha * 1.2})`;
          ctx.lineWidth = 1.6;
        } else {
          ctx.strokeStyle = `${colors.main}${depthAlpha})`;
          ctx.lineWidth = type === 'rib' ? 0.7 : 1.1;
        }
        ctx.stroke();
      });

      // Draw Vertex Nodes
      projected.forEach((pt) => {
        if (pt.tag === 'node') {
          // Central Glowing Core Node
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#ff2a2a';
          ctx.shadowColor = '#ff2a2a';
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (activeLayer !== 'CORE') {
          // Subtle vertex dots
          ctx.fillStyle = `${colors.main}0.5)`;
          ctx.fillRect(pt.x - 1, pt.y - 1, 2, 2);
        }
      });

      // Technical Blueprint Gridlines & Calipers
      ctx.strokeStyle = colors.dim;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 6]);

      // Center crosshair
      ctx.beginPath();
      ctx.moveTo(width / 2 - 80, height / 2);
      ctx.lineTo(width / 2 + 80, height / 2);
      ctx.moveTo(width / 2, height / 2 - 120);
      ctx.lineTo(width / 2, height / 2 + 120);
      ctx.stroke();
      ctx.setLineDash([]);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [isRotatingAuto, activeLayer, wireColor]);

  // Mouse Interaction: Free 3D Drag Orbit
  const handleMouseDown = (e) => {
    isDragging.current = true;
    previousMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - previousMouse.current.x;
    const deltaY = e.clientY - previousMouse.current.y;

    angles.current.y += deltaX * 0.009;
    angles.current.x = Math.max(-1.4, Math.min(1.4, angles.current.x + deltaY * 0.009));

    previousMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div 
      className="relative w-full h-80 my-4 flex flex-col items-center justify-center select-none overflow-hidden border border-cyan-900/60 bg-[#04060a]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* CAD Blueprint Background Grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#0a1b2a_1px,transparent_1px),linear-gradient(to_bottom,#0a1b2a_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

      {/* 3D Blueprint Canvas */}
      <canvas 
        ref={canvasRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing z-10" 
      />

      {/* Top Left HUD Telemetry */}
      <div className="pointer-events-none absolute top-3 left-3 font-mono text-[9px] text-cyan-500/80 space-y-0.5 z-20">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold tracking-widest uppercase">SCHEMATIC // WIRE-MESH 3D</span>
        </div>
        <div>DIAMETER: <span className="text-white">68.0 MM</span></div>
        <div>AXIAL LENGTH: <span className="text-white">210.0 MM</span></div>
        <div>TOLERANCE: <span className="text-white">&plusmn;0.002 MM</span></div>
      </div>

      {/* Top Right Blueprint Options */}
      <div className="absolute top-3 right-3 flex gap-1 z-20">
        {['cyan', 'amber', 'red'].map((color) => (
          <button
            key={color}
            onClick={() => {
              sound.playClick();
              setWireColor(color);
            }}
            className={`w-4 h-4 rounded-full border border-neutral-700 ${
              color === 'cyan' ? 'bg-cyan-500' : color === 'amber' ? 'bg-amber-500' : 'bg-red-500'
            } ${wireColor === color ? 'ring-2 ring-white scale-110' : 'opacity-60'}`}
          />
        ))}
      </div>

      {/* Bottom Bar: Layer Isolation & Turntable Toggle */}
      <div className="absolute bottom-3 inset-x-3 flex justify-between items-center z-20 font-mono text-[9px]">
        {/* Layer Switches */}
        <div className="flex gap-1.5 bg-black/80 border border-neutral-800 p-1">
          {['ALL', 'HULL', 'CORE'].map((layer) => (
            <button
              key={layer}
              onClick={() => {
                sound.playClick();
                setActiveLayer(layer);
              }}
              className={`px-2 py-0.5 uppercase tracking-wider font-bold transition-colors ${
                activeLayer === layer ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {layer}
            </button>
          ))}
        </div>

        {/* Orbit / Turntable toggle */}
        <button
          onClick={() => {
            sound.playClick();
            setIsRotatingAuto(!isRotatingAuto);
          }}
          className="border border-cyan-800/80 bg-black/80 px-2.5 py-1 uppercase text-cyan-400 hover:border-cyan-400 transition-colors"
        >
          {isRotatingAuto ? '[PAUSE ORBIT]' : '[RESUME ORBIT]'}
        </button>
      </div>

      {/* Bottom Center Prompt */}
      <div className="pointer-events-none absolute bottom-1.5 text-[8px] font-mono text-neutral-500 uppercase tracking-widest z-10">
        [CLICK + DRAG TO FREE ORBIT IN 3D]
      </div>
    </div>
  );
}