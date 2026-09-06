import { useEffect, useState } from "react";

const SPLASH_SHOWN_KEY = "epl-splash-shown";
const SPLASH_DURATION = 2000;

export function LoadingScreen({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const alreadyShown = sessionStorage.getItem(SPLASH_SHOWN_KEY);
    if (alreadyShown) return;

    setShow(true);
    const t = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        setShow(false);
        sessionStorage.setItem(SPLASH_SHOWN_KEY, "1");
      }, 700);
    }, SPLASH_DURATION);

    return () => clearTimeout(t);
  }, []);

  if (!show) return <>{children}</>;

  return (
    <div className="relative">
      <div
        className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[oklch(0.10_0.04_275)] transition-opacity duration-700 ${
          exiting ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        {/* Soft glow backdrop */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 45%, oklch(0.65 0.30 300 / 0.12), transparent 70%), radial-gradient(50% 40% at 50% 60%, oklch(0.68 0.24 240 / 0.10), transparent 70%)",
          }}
        />

        {/* Ball arc scene */}
        <div className="relative z-10 aspect-[448/160] w-full max-w-md">
          {/* Pitch ground line */}
          <div
            className="absolute bottom-6 left-1/2 h-px w-full -translate-x-1/2"
            style={{
              background:
                "linear-gradient(to right, transparent, oklch(0.65 0.30 300 / 0.6), oklch(0.68 0.24 240 / 0.6), transparent)",
              animation: "groundGlow 2s ease-out both",
            }}
          />

          {/* Trajectory path that draws itself */}
          <svg
            viewBox="0 0 448 160"
            className="absolute inset-0 h-full w-full overflow-visible"
            aria-hidden
          >
            <path
              d="M 10 130 Q 224 -40 438 110"
              fill="none"
              stroke="url(#eplArcGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              pathLength={1}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 1,
                animation: "drawArc 1s ease-out 0.1s forwards",
                filter: "drop-shadow(0 0 6px oklch(0.65 0.30 300 / 0.8))",
              }}
            />
            <defs>
              <linearGradient id="eplArcGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="oklch(0.65 0.30 300)" />
                <stop offset="1" stopColor="oklch(0.68 0.24 240)" />
              </linearGradient>
            </defs>
          </svg>

          {/* Neon cricket ball traveling the arc (motion path matches SVG) */}
          <div
            className="absolute left-0 top-0 h-7 w-7 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 35% 30%, oklch(0.96 0.04 280), oklch(0.65 0.30 300) 55%, oklch(0.45 0.22 300))",
              boxShadow:
                "0 0 14px oklch(0.65 0.30 300 / 0.9), 0 0 32px oklch(0.68 0.24 240 / 0.5)",
              offsetPath: "path('M 10 130 Q 224 -40 438 110')",
              offsetRotate: "0deg",
              animation: "ballArc 1s ease-out 0.1s both, ballPulse 0.5s ease-in-out 1.1s infinite alternate",
            }}
          >
            {/* Seam */}
            <div
              className="absolute inset-[3px] rounded-full"
              style={{
                border: "1.5px dashed oklch(0.95 0.05 280 / 0.55)",
                animation: "seamSpin 0.8s linear infinite",
              }}
            />
          </div>

          {/* Landing impact ring */}
          <div
            className="absolute left-0 top-0 h-10 w-10 rounded-full border-2"
            style={{
              offsetPath: "path('M 10 130 Q 224 -40 438 110')",
              offsetDistance: "100%",
              marginLeft: "-20px",
              marginTop: "-20px",
              borderColor: "oklch(0.68 0.24 240 / 0.8)",
              boxShadow: "0 0 18px oklch(0.68 0.24 240 / 0.6)",
              animation: "impactRing 0.7s ease-out 1.05s both",
            }}
          />
        </div>

        {/* EPL branding */}
        <div className="relative z-10 mt-6 text-center">
          <h1
            className="text-6xl font-extrabold tracking-tighter sm:text-7xl"
            style={{
              background: "var(--gradient-neon)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter:
                "drop-shadow(0 0 16px oklch(0.65 0.30 300 / 0.45)) drop-shadow(0 0 32px oklch(0.68 0.24 240 / 0.25))",
              animation: "titlePop 0.6s cubic-bezier(0.2, 0.8, 0.3, 1.2) 0.75s both",
            }}
          >
            EPL
          </h1>
          <p
            className="mt-2 text-sm font-medium tracking-[0.3em] uppercase text-[oklch(0.72_0.05_280)]"
            style={{ animation: "fadeUp 0.5s ease-out 0.95s both" }}
          >
            ESAG Premier League
          </p>
        </div>

        {/* Progress bar */}
        <div className="relative z-10 mt-10 w-56 sm:w-72">
          <div className="h-1 w-full overflow-hidden rounded-full bg-[oklch(0.22_0.05_275)]">
            <div
              className="h-full rounded-full bg-gradient-neon"
              style={{
                animation: "loadBar 2s cubic-bezier(0.4, 0, 0.2, 1) forwards",
                boxShadow: "0 0 10px oklch(0.65 0.30 300 / 0.6)",
              }}
            />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
