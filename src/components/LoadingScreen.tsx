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
        {/* Animated background field lines */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute left-1/2 top-1/2 h-[120vh] w-1 -translate-x-1/2 -translate-y-1/2 rotate-12 bg-gradient-to-b from-transparent via-[oklch(0.65_0.30_300_/0.4)] to-transparent blur-sm" />
          <div className="absolute left-1/2 top-1/2 h-[120vh] w-1 -translate-x-1/2 -translate-y-1/2 -rotate-12 bg-gradient-to-b from-transparent via-[oklch(0.68_0.24_240_/0.4)] to-transparent blur-sm" />
          <div className="absolute left-1/2 top-1/2 h-[80vh] w-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[oklch(0.65_0.30_300_/0.15)]" />
          <div className="absolute left-1/2 top-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[oklch(0.68_0.24_240_/0.15)]" />
        </div>

        {/* Cricket pitch / stumps scene */}
        <div className="relative z-10 flex h-48 w-64 items-end justify-center">
          {/* Stumps */}
          <div className="absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-24 w-2 rounded-sm bg-gradient-to-b from-[oklch(0.85_0.10_80)] to-[oklch(0.60_0.14_70)]"
                style={{
                  boxShadow: "0 0 14px oklch(0.65 0.30 300 / 0.5)",
                  animation: `stumpPulse 0.55s ease-in-out ${1.1 + i * 0.06}s both`,
                }}
              />
            ))}
            {/* Bails */}
            <div
              className="absolute -top-1 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-[oklch(0.85_0.10_80)]"
              style={{
                boxShadow: "0 0 10px oklch(0.68 0.24 240 / 0.6)",
                animation: "bailFly 0.6s ease-out 1.2s both",
              }}
            />
          </div>

          {/* Neon cricket ball */}
          <div
            className="absolute bottom-8 left-1/2 z-20 h-10 w-10 -translate-x-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, oklch(0.95 0.05 280), oklch(0.65 0.30 300) 60%)",
              boxShadow:
                "0 0 20px oklch(0.65 0.30 300 / 0.8), 0 0 40px oklch(0.68 0.24 240 / 0.5), inset 0 0 8px oklch(0.95 0.05 280 / 0.4)",
              animation: "ballBounce 1.3s cubic-bezier(0.36, 0, 0.66, -0.56) both",
            }}
          >
            {/* Seam */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: "2px solid oklch(0.95 0.05 280 / 0.6)",
                clipPath: "polygon(20% 0%, 80% 0%, 80% 100%, 20% 100%)",
              }}
            />
          </div>

          {/* Impact burst */}
          <div
            className="absolute bottom-6 left-1/2 z-10 h-20 w-20 -translate-x-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, oklch(0.68 0.24 240 / 0.5) 0%, oklch(0.65 0.30 300 / 0) 70%)",
              animation: "impactBurst 0.4s ease-out 1.15s both",
            }}
          />
        </div>

        {/* EPL branding */}
        <div className="relative z-10 mt-8 text-center">
          <h1
            className="text-5xl font-extrabold tracking-tighter sm:text-6xl"
            style={{
              background: "var(--gradient-neon)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              textShadow:
                "0 0 18px oklch(0.65 0.30 300 / 0.5), 0 0 36px oklch(0.68 0.24 240 / 0.3)",
              animation: "titlePop 0.7s ease-out 1.4s both",
            }}
          >
            EPL
          </h1>
          <p
            className="mt-2 text-sm font-medium tracking-wide text-[oklch(0.72_0.05_280)]"
            style={{ animation: "fadeUp 0.6s ease-out 1.6s both" }}
          >
            ESAG Premier League
          </p>
        </div>

        {/* Progress bar */}
        <div className="relative z-10 mt-10 w-56 sm:w-72">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[oklch(0.22_0.05_275)]">
            <div
              className="h-full rounded-full bg-gradient-neon"
              style={{ animation: "loadBar 2s ease-in-out forwards" }}
            />
          </div>
          <p
            className="mt-2 text-center text-xs text-muted-foreground"
            style={{ animation: "fadeUp 0.6s ease-out 1.7s both" }}
          >
            Loading the pitch…
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
