import { useEffect, useRef, useState, useCallback } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface GeoShape {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  type: "triangle" | "circle" | "rect" | "hexagon";
  color: string;
  opacity: number;
}

const PSYCHO_COLORS = [
  "#ff0080", "#00ffff", "#ff6600", "#39ff14", "#bf00ff",
  "#ff003c", "#00ff9f", "#ffee00", "#ff69b4", "#00bfff",
];

const randomColor = () => PSYCHO_COLORS[Math.floor(Math.random() * PSYCHO_COLORS.length)];

const initShapes = (): GeoShape[] =>
  Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 40 + Math.random() * 140,
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 1.2,
    type: (["triangle", "circle", "rect", "hexagon"] as const)[Math.floor(Math.random() * 4)],
    color: randomColor(),
    opacity: 0.08 + Math.random() * 0.18,
  }));

export default function Index() {
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [shapes, setShapes] = useState<GeoShape[]>(initShapes);
  const [glitch, setGlitch] = useState(false);
  const [clickFlash, setClickFlash] = useState(false);
  const animRef = useRef<number>();
  const particleId = useRef(0);
  const frameRef = useRef(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
  }, []);

  const handleClick = useCallback((e: MouseEvent) => {
    const newParticles: Particle[] = Array.from({ length: 40 }, () => ({
      id: particleId.current++,
      x: e.clientX,
      y: e.clientY,
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.5) * 18,
      life: 1,
      color: randomColor(),
      size: 4 + Math.random() * 10,
    }));
    setParticles(prev => [...prev.slice(-120), ...newParticles]);
    setGlitch(true);
    setClickFlash(true);
    setTimeout(() => setGlitch(false), 350);
    setTimeout(() => setClickFlash(false), 120);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
    };
  }, [handleMouseMove, handleClick]);

  useEffect(() => {
    const tick = () => {
      frameRef.current++;
      setParticles(prev =>
        prev
          .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.4, life: p.life - 0.028 }))
          .filter(p => p.life > 0)
      );
      if (frameRef.current % 3 === 0) {
        setShapes(prev =>
          prev.map(s => ({ ...s, rotation: s.rotation + s.rotSpeed }))
        );
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current!);
  }, []);

  const dx = (mouse.x - 0.5) * 60;
  const dy = (mouse.y - 0.5) * 60;

  const renderShape = (s: GeoShape) => {
    const style: React.CSSProperties = {
      position: "absolute",
      left: `${s.x}%`,
      top: `${s.y}%`,
      width: s.size,
      height: s.size,
      opacity: s.opacity,
      transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
      pointerEvents: "none",
      filter: `blur(${s.size > 120 ? 2 : 0}px)`,
    };

    if (s.type === "circle") {
      return (
        <div key={s.id} style={{ ...style, borderRadius: "50%", border: `2px solid ${s.color}`, background: `${s.color}22` }} />
      );
    }
    if (s.type === "rect") {
      return (
        <div key={s.id} style={{ ...style, border: `2px solid ${s.color}`, background: `${s.color}11` }} />
      );
    }
    if (s.type === "triangle") {
      return (
        <svg key={s.id} style={{ ...style, overflow: "visible" }} viewBox="0 0 100 100">
          <polygon points="50,5 95,90 5,90" fill={`${s.color}22`} stroke={s.color} strokeWidth="2" />
        </svg>
      );
    }
    return (
      <svg key={s.id} style={{ ...style, overflow: "visible" }} viewBox="0 0 100 100">
        <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill={`${s.color}22`} stroke={s.color} strokeWidth="2" />
      </svg>
    );
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#000",
        overflow: "hidden",
        position: "relative",
        cursor: "crosshair",
      }}
    >
      {/* Flash on click */}
      {clickFlash && (
        <div style={{
          position: "absolute", inset: 0, background: "white", opacity: 0.08, zIndex: 50, pointerEvents: "none",
        }} />
      )}

      {/* Scanlines */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none",
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)",
      }} />

      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 6, pointerEvents: "none",
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)",
      }} />

      {/* Geo shapes layer */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        {shapes.map(renderShape)}
      </div>

      {/* Mouse-reactive glow */}
      <div style={{
        position: "absolute",
        left: `${mouse.x * 100}%`,
        top: `${mouse.y * 100}%`,
        width: 500,
        height: 500,
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        background: `radial-gradient(circle, ${PSYCHO_COLORS[Math.floor(frameRef.current / 30) % PSYCHO_COLORS.length]}33 0%, transparent 70%)`,
        pointerEvents: "none",
        zIndex: 2,
        transition: "background 0.6s",
      }} />

      {/* Particles */}
      <svg style={{ position: "absolute", inset: 0, zIndex: 8, pointerEvents: "none" }} width="100%" height="100%">
        {particles.map(p => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.size * p.life}
            fill={p.color}
            opacity={p.life * 0.9}
          />
        ))}
      </svg>

      {/* Main word */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "none",
      }}>
        {/* Chromatic aberration layers */}
        <span style={{
          position: "absolute",
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 700,
          fontSize: "clamp(120px, 22vw, 320px)",
          letterSpacing: "0.05em",
          color: "#ff0080",
          transform: `translate(${dx * 0.9 - 6}px, ${dy * 0.9}px)`,
          opacity: 0.5,
          mixBlendMode: "screen",
          userSelect: "none",
          filter: "blur(1px)",
        }}>
          ХУЙ
        </span>
        <span style={{
          position: "absolute",
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 700,
          fontSize: "clamp(120px, 22vw, 320px)",
          letterSpacing: "0.05em",
          color: "#00ffff",
          transform: `translate(${dx * 0.9 + 6}px, ${dy * 0.9}px)`,
          opacity: 0.5,
          mixBlendMode: "screen",
          userSelect: "none",
          filter: "blur(1px)",
        }}>
          ХУЙ
        </span>

        {/* Main text */}
        <span
          style={{
            position: "relative",
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: "clamp(120px, 22vw, 320px)",
            letterSpacing: "0.05em",
            color: "#fff",
            transform: `translate(${dx * 0.9}px, ${dy * 0.9}px)`,
            userSelect: "none",
            textShadow: glitch
              ? `0 0 40px #ff0080, 12px 0 0 #00ffff, -12px 0 0 #ff0080, 0 0 80px #fff`
              : `0 0 40px #fff6, 0 0 80px #fff3, 0 0 120px #fff1`,
            transition: glitch ? "none" : "transform 0.12s ease-out, text-shadow 0.3s",
            animation: glitch ? "none" : undefined,
            filter: glitch ? `hue-rotate(${Math.random() * 360}deg)` : "none",
          }}
        >
          ХУЙ
        </span>
      </div>

      {/* Bottom hint */}
      <div style={{
        position: "absolute", bottom: 32, left: 0, right: 0,
        zIndex: 15, textAlign: "center", pointerEvents: "none",
        fontFamily: "monospace", fontSize: 11, color: "#ffffff33",
        letterSpacing: "0.3em", textTransform: "uppercase",
      }}>
        двигай мышью · кликай
      </div>
    </div>
  );
}
