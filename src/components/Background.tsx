'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

// Image URLs (assuming they are stored in your public directory)
const imageUrls = [
  '/posts/IMG_0261.jpg', '/posts/IMG_0262.jpg', '/posts/IMG_0263.jpg', '/posts/IMG_0266.jpg',
  '/posts/IMG_0267.jpg', '/posts/IMG_0268.jpg', '/posts/IMG_0270.jpg', '/posts/IMG_0271.jpg',
  '/posts/IMG_0273.jpg', '/posts/IMG_0275.jpg', '/posts/IMG_0276.jpg', '/posts/IMG_0277.jpg',
  '/posts/IMG_0278.jpg', '/posts/IMG_0279.jpg', '/posts/IMG_0281.jpg', '/posts/IMG_0282.jpg',
  '/posts/IMG_0284.jpg', '/posts/IMG_0285.jpg', '/posts/IMG_0286.jpg', '/posts/IMG_0287.jpg',
  '/posts/IMG_0288.jpg', '/posts/IMG_0289.jpg', '/posts/IMG_0290.jpg', '/posts/IMG_0291.jpg',
  '/posts/IMG_0292.jpg', '/posts/IMG_0293.jpg', '/posts/IMG_0294.jpg'
]

const MAX_IMAGES = 20 // Max number of images on screen at once

interface FloatingImage {
  id: string
  src: string
  x: number
  y: number
  width: number
  height: number
}

export default function FloatingImages() {
  const [images, setImages] = useState<FloatingImage[]>([])
  const [windowWidth, setWindowWidth] = useState(0)  // Set initial values to 0 or any default
  const [windowHeight, setWindowHeight] = useState(0)  // Set initial values to 0 or any default
  const [spawnedImages, setSpawnedImages] = useState<Set<string>>(new Set()) // Track spawned image sources

  // Helper function to generate unique IDs for images
  const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Helper function to create a new image with random properties
  const createImage = () => {
	let src: string

	// Ensure the new image has not been spawned yet by checking spawnedImages
	do {
	  src = imageUrls[Math.floor(Math.random() * imageUrls.length)]
	} while (spawnedImages.has(src)) // Keep trying until we find an image that's not been spawned yet

	const id = generateUniqueId()
	
	// Randomize image width and height, ensuring it fits within the screen dimensions
	const width = Math.random() * 200 + 100  // Random width between 100px and 300px
	const aspectRatio = 1.5 + Math.random() * 2 // Random aspect ratio between 1.5 and 3
	const height = width / aspectRatio      // Height based on aspect ratio
	
	// Randomize the starting position of the image, ensuring it fits on the screen
	const x = Math.random() * (windowWidth - 3) // Random horizontal position
	let y = windowHeight + height                // Start below the screen vertically
	if (y < 200) {
		y = 1200
	}
	console.log(y)

	return { id, src, x, y, width, height }
  }

  // Handle window resizing (client-side only)
  useEffect(() => {
	if (typeof window !== 'undefined') {
	  const handleResize = () => {
		setWindowWidth(window.innerWidth)
		setWindowHeight(window.innerHeight)
	  }
	  
	  // Set initial window size after the component mounts
	  handleResize()

	  window.addEventListener('resize', handleResize)
	  return () => window.removeEventListener('resize', handleResize)
	}
  }, [])

  useEffect(() => {
	  const spawnInterval = setInterval(() => {
		if (images.length < MAX_IMAGES) {
		  const newImage = createImage();
		  setImages((prevImages) => {
			const updatedImages = [...prevImages, newImage];
			setSpawnedImages((prevSet) => new Set([...prevSet, newImage.src]));
			return updatedImages;
		  });
		}
	  }, 4000);
  
	  return () => clearInterval(spawnInterval);  // Cleanup function
	}, [images.length, createImage]);

  // Handle the completion of an image's animation (remove it when it's off-screen)
  const handleImageComplete = (id: string, src: string) => {
	setImages((prevImages) => prevImages.filter((image) => image.id !== id))
	setSpawnedImages((prevSet) => {
	  const updatedSet = new Set(prevSet)
	  updatedSet.delete(src) // Remove the image src from the set
	  return updatedSet
	})
  }

  return (
	<div className="fixed inset-0 overflow-hidden pointer-events-none">
	  {images.map((image) => (
		<motion.div
		  key={image.id}
		  style={{
			position: 'absolute',
			left: `${image.x}px`,
			top: `${image.y}px`,
			borderRadius: '10px',
			overflow: 'hidden',
			boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.25)',
		  }}
		  animate={{
			y: [-image.height, -windowHeight - image.height - image.height - image.height - image.height -  image.height - image.height - image.height], // Move the image beyond the screen completely
		  }}
		  transition={{
			type: 'tween',  // Smooth movement
			duration: 50,    // Adjusted duration for smooth upward movement
			ease: 'linear',
		  }}
		  onAnimationComplete={() => handleImageComplete(image.id, image.src)} // Remove image once off-screen
		>
		  <motion.div
			style={{
			  width: '100%',
			  height: '100%',
			}}
		  >
			<Image
			  src={image.src}
			  alt=""
			  width={image.width} // Directly set width
			  height={image.height} // Directly set height
			  // No layout="fill" so it respects the natural aspect ratio
			/>
		  </motion.div>
		</motion.div>
	  ))}
	</div>
  )
}
