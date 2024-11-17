import Image from "next/image";
import Link from "next/link";

interface UserFollowCardProps {
  src: string;
  name: string;
  platform: string;
  cta: string;
  link: string;
  buttonColor?: string;
  textColor: 'white';
}

export default function SocialAccount({ src, name, platform, cta, link, buttonColor, textColor }: UserFollowCardProps) {
  return (
	<div className="flex items-center bg-white rounded-lg shadow-lg p-3 gap-3 relative">
	  {/* App Icon */}
	  <div className="flex-shrink-0">
		<Image
		  className="rounded-xl shadow"
		  src={src}
		  alt={`${name}'s icon`}
		  width={50}
		  height={50}
		/>
	  </div>
	  
	  {/* Text Content */}
	  <div className="flex flex-col">
		<span className="text-md font-bold">{name}</span>
		<span className="text-sm text-gray-500">{platform}</span>
	  </div>
	  
	  {/* Empty Space */}
	  <div className="flex-grow" />
	  
	  {/* Follow Button */}
	  <Link href={link} passHref>
		<button
		  className={`text-white text-sm font-medium px-4 py-2 rounded-full transition-all hover:opacity-90`}
		  style={{ 
			  backgroundColor: buttonColor || '#3B82F6',  // Default to blue if no buttonColor is provided
			  color: textColor || 'white' // Use the textColor prop, default to white
			}}
		>
		  {cta}
		</button>
	  </Link>
	</div>
  );
}
