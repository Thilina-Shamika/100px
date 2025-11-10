"use client"

import { useState } from "react"
import Masonry, { MasonryItem } from "@/components/masonry"
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"

interface ServiceGalleryProps {
  gallery: Array<{
    id?: number
    url?: string
    alt?: string
    width?: number
    height?: number
  }>
}

export function ServiceGallery({ gallery }: ServiceGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  if (!gallery || gallery.length === 0) {
    return null
  }

  // Convert gallery images to Masonry items
  const masonryItems: MasonryItem[] = gallery
    .filter((image) => image.url)
    .map((image, index) => {
      // Use actual image dimensions if available
      // Calculate height based on aspect ratio or use default
      let height = 400
      if (image.width && image.height) {
        // Use the actual height for masonry layout
        height = image.height
      } else if (image.width) {
        // Estimate height based on common aspect ratios (assuming portrait orientation)
        height = image.width * 1.33 // 3:4 aspect ratio
      }
      return {
        id: image.id?.toString() || `gallery-${index}`,
        img: image.url!,
        url: image.url,
        height: height,
      }
    })

  // Convert to lightbox slides
  const slides = masonryItems.map((item) => ({
    src: item.img,
    alt: item.id,
  }))

  const handleItemClick = (item: MasonryItem) => {
    const index = masonryItems.findIndex((i) => i.id === item.id)
    if (index !== -1) {
      setLightboxIndex(index)
      setLightboxOpen(true)
    }
  }

  return (
    <>
      <div className="w-full" style={{ minHeight: '400px' }}>
        <Masonry
          items={masonryItems}
          ease="power3.out"
          duration={0.6}
          stagger={0.05}
          animateFrom="bottom"
          scaleOnHover={true}
          hoverScale={0.95}
          blurToFocus={true}
          colorShiftOnHover={false}
          onItemClick={handleItemClick}
          disableInitialAnimation
        />
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={slides}
      />
    </>
  )
}

