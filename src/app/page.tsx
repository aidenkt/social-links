// pages/index.js
import Image from "next/image";
import SectionPicker from '../components/SectionPicker';
import Background from '../components/Background';
import { Oswald } from 'next/font/google'

const oswald = Oswald({
  weight: '500',
  subsets: ['latin'],
})

export default function Home() {
  return (
    <div className="relative grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen pb-20 gap-12 sm:p-20 font-[family-name:var(--font-geist-sans)] overflow-hidden">
      <Background />
      
      <main className="flex flex-col gap-12 row-start-2 items-center z-10">
        
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
        <span className="block md:inline">
          {"There's more where "}
        </span> 
        <span className="block md:inline">
          {"that came from."}
        </span>
      </p>
        
        <SectionPicker />
      </main>
      <footer className="row-start-3 flex flex-wrap items-center justify-center z-10">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
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
        <p className="text-center w-full">
          Created by Aiden Tabrizi
        </p>
      </footer>
    </div>
  );
}
