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
    <div
      className="
        relative
        grid
        grid-rows-[auto_1fr_auto]
        sm:grid-rows-[20px_1fr_20px]
        items-center
        justify-items-center
        min-h-screen
        pb-[calc(1rem+env(safe-area-inset-bottom))]
        sm:pb-20
        gap-12
        sm:p-20
        overflow-hidden
      "
    >
      <Background />

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

      <footer className="row-start-3 mt-12 sm:mt-0 flex items-center gap-2 hover:underline z-10">
        <a
          className="flex items-center gap-2"
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
  );
}
