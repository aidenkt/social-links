import localFont from "next/font/local";
import { PLATFORM_ICON_PATHS } from "../lib/platform-icons";
import {
  BFCACHE_PENDING_KEY,
  SOCIAL_LINKS_BACKGROUND_RESUME,
} from "../lib/background-resume";
import { buildPageMetadata } from "../lib/site";
import "./globals.css";

/**
 * Runs during HTML parse — before the React tree mounts — so `pageshow` events
 * fired immediately after a Back/Forward (BFCache or history) are captured even
 * if the Background chunk hasn't loaded yet. Hands off via sessionStorage + a
 * CustomEvent that `Background.tsx` picks up.
 */
const bgPageshowScript = `(function(){
var EVT=${JSON.stringify(SOCIAL_LINKS_BACKGROUND_RESUME)};
var KEY=${JSON.stringify(BFCACHE_PENDING_KEY)};
function navType(){try{var n=performance.getEntriesByType("navigation")[0];return n&&n.type||"";}catch(e){return""}}
function dispatch(){try{window.dispatchEvent(new CustomEvent(EVT));}catch(e){}}
function onShow(e){
  if(e.persisted){try{sessionStorage.setItem(KEY,"1");}catch(_){}}
  if(e.persisted||navType()==="back_forward")dispatch();
}
window.addEventListener("pageshow",onShow);
if(navType()==="back_forward")dispatch();
})();`;

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = buildPageMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="max-md:h-[100dvh] max-md:max-h-[100dvh] max-md:overflow-hidden max-md:overscroll-none"
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bgPageshowScript }} />
        {PLATFORM_ICON_PATHS.map((href) => (
          <link key={href} rel="preload" href={href} as="image" />
        ))}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased max-md:h-full max-md:min-h-0 max-md:overflow-hidden max-md:overscroll-none`}
      >
        <div className="max-md:h-full max-md:min-h-0 max-md:max-h-[100dvh] max-md:overflow-hidden max-md:overscroll-none md:contents">
          {children}
        </div>
      </body>
    </html>
  );
}
