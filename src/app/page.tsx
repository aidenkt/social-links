// pages/index.js
import Image from "next/image";
import SectionPicker from "../components/SectionPicker";
import Background from "../components/Background";
import { Oswald } from "next/font/google";

const oswald = Oswald({
  weight: "500",
  subsets: ["latin"],
});

export default function Home() {
  return (
    // Wrap everything in a safe-area bottom pad
    <div className="relative min-h-screen overflow-hidden pb-[env(safe-area-inset-bottom)]">
      <Background />

      {/* 
        flex-col layout:
        - justify-around on mobile
        - justify-between on sm+ 
        with consistent px/py padding 
      */}
      <div className="relative flex flex-col items-center justify-around sm:justify-between min-h-screen px-6 py-12 sm:px-20 sm:py-20">
        
        <main className="flex flex-col gap-12 items-center z-10">
          <p
            className={`
              ${oswald.className}
              font-semibold
              text-2xl
              text-center
              backdrop-blur-3xl
              rounded-lg
              px-2
            `}
          >
            <span className="block md:inline">{"There's more where "}</span>
            <span className="block md:inline">{"that came from."}</span>
          </p>

          <SectionPicker />
        </main>

        <footer className="z-10">
          <a
            className="flex items-center gap-2 hover:underline"
            href="https://aidenkt.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/globe.svg"
              alt="Globe icon"
              width={16}
              height={16}
            />
            Explore more →
          </a>
        </footer>
      </div>
    </div>
  );
}
