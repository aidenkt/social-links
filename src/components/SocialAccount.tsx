import Image from "next/image";
import TrackedOutboundLink from "./TrackedOutboundLink";

interface UserFollowCardProps {
  src: string;
  name: string;
  platform: string;
  cta: string;
  link: string;
  buttonColor?: string;
  textColor?: string;
}

export default function SocialAccount({ src, name, platform, cta, link, buttonColor, textColor = 'white' }: UserFollowCardProps) {
  return (
	<div
	  className="relative flex items-center gap-3 rounded-lg border border-neutral-200/70 bg-white p-3 shadow-sm max-sm:border-0 max-sm:bg-white max-sm:shadow-sm"
	  onContextMenu={(event) => event.preventDefault()}
	  onDragStart={(event) => event.preventDefault()}
	>
	  <div className="flex-shrink-0 select-none">
		<Image
		  className="pointer-events-none rounded-[22%] object-cover shadow-sm ring-1 ring-black/[0.06] select-none"
		  src={src}
		  alt=""
		  width={50}
		  height={50}
		  unoptimized
		  draggable={false}
		/>
	  </div>

	  <div className="flex min-w-0 flex-col">
		<span className="truncate text-base font-bold">{name}</span>
		<span className="truncate text-sm text-neutral-500">{platform}</span>
	  </div>

	  <div className="flex-grow" />

	  <TrackedOutboundLink
		href={link}
		className="inline-flex h-9 min-w-[5.75rem] shrink-0 items-center justify-center rounded-full px-4 text-sm font-medium tabular-nums transition-all hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/35 focus-visible:ring-offset-2"
		target="_blank"
		rel={link.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
		analyticsLabel={cta}
		analyticsSource={`social-card:${platform}`}
		style={{
		  backgroundColor: buttonColor || '#3B82F6',
		  color: textColor,
		}}
	  >
		{cta}
	  </TrackedOutboundLink>
	</div>
  );
}
