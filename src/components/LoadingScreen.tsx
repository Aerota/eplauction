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
        {/* Soft background glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 50%, oklch(0.65 0.30 300 / 0.12), transparent 70%)",
          }}
        />

        {/* Wheel + logo lockup */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative h-40 w-40">
            <svg
              className="absolute inset-0 h-full w-full -rotate-90"
              viewBox="0 0 100 100"
              aria-hidden
            >
              {/* Track */}
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="oklch(0.22 0.05 275)"
                strokeWidth="6"
              />
              {/* Filling wheel */}
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="url(#wheelGrad)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46}
                style={{
                  animation: "wheelFill 2s ease-out forwards",
                  filter: "drop-shadow(0 0 8px oklch(0.65 0.30 300 / 0.7))",
                }}
              />
              <defs>
                <linearGradient
                  id="wheelGrad"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0%" stopColor="oklch(0.65 0.30 300)" />
                  <stop offset="100%" stopColor="oklch(0.68 0.24 240)" />
                </linearGradient>
              </defs>
            </svg>

            {/* Centered EPL logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src="/favicon.png"
                alt="EPL"
                className="h-20 w-20 object-contain"
                style={{
                  animation:
                    "logoPop 0.6s cubic-bezier(0.2, 0.8, 0.3, 1.2) 0.2s both",
                }}
              />
            </div>
          </div>

          <h1
            className="mt-6 text-5xl font-extrabold tracking-tighter sm:text-6xl"
            style={{
              background: "var(--gradient-neon)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              animation:
                "titlePop 0.6s cubic-bezier(0.2, 0.8, 0.3, 1.2) 0.4s both",
            }}
          >
            EPL
          </h1>
          <p
            className="mt-2 text-sm font-medium tracking-[0.3em] uppercase text-[oklch(0.72_0.05_280)]"
            style={{ animation: "fadeUp 0.5s ease-out 0.6s both" }}
          >
            ESAG Premier League
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
