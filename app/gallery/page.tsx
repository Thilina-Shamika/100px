import { fetchWordPressGalleryPage } from "@/lib/wordpress"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { generateSlug } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Gallery",
  description: "Our Gallery - Some of the best shoots we have done",
}

export default async function GalleryPage() {
  const galleryPage = await fetchWordPressGalleryPage()

  if (!galleryPage) {
    notFound()
  }

  const acf = galleryPage.acf as any
  const backgroundImage = acf?.background_image
  const heading = acf?.heading || "Our Gallery"
  const subheading = acf?.subheading || "some of the best shoots we have done"
  const galleryItems = acf?.gallery_items || []

  return (
    <div className="bg-black min-h-screen text-white">
      {/* Header Image Section */}
      {backgroundImage?.url && (
        <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden">
          {backgroundImage.url.startsWith('http://100px.local') || backgroundImage.url.startsWith('https://website.100px.lk') ? (
            <img
              src={backgroundImage.url}
              alt={backgroundImage.alt || "Gallery"}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={backgroundImage.url}
              alt={backgroundImage.alt || "Gallery"}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          )}
          <div className="absolute inset-0 bg-black/40" />
          
          {/* Header Content Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 z-10">
            <h1 className="text-white mb-4" style={{ fontSize: '54px', fontWeight: 400, lineHeight: '54px' }}>
              {heading}
            </h1>
            <p className="text-white/90 subheading max-w-2xl" style={{ fontSize: '16px' }}>
              {subheading}
            </p>
          </div>
        </div>
      )}

      {/* Albums Grid */}
      {galleryItems.length > 0 && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {galleryItems.map((album: any, index: number) => {
              const albumSlug = generateSlug(album.album_name) || `album-${index}`
              const albumCover = album.album_cover_image
              const albumName = album.album_name || "Album"
              
              return (
                <Link
                  key={index}
                  href={`/gallery/${albumSlug}`}
                  className="relative rounded-xl overflow-hidden bg-black group border border-[#191919] block"
                >
                  <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px]">
                    {albumCover?.url ? (
                      albumCover.url.startsWith('http://100px.local') || albumCover.url.startsWith('https://website.100px.lk') ? (
                        <img
                          src={albumCover.url}
                          alt={albumName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Image
                          src={albumCover.url}
                          alt={albumName}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      )
                    ) : (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <span className="text-white/50 text-sm">No Album Cover</span>
                      </div>
                    )}
                    
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                    
                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 lg:p-10">
                      <h3 className="text-white text-xl sm:text-2xl font-semibold">
                        {albumName}
                      </h3>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* No albums message */}
      {galleryItems.length === 0 && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="text-center">
            <p className="text-white/70 text-lg">No gallery albums available yet.</p>
          </div>
        </div>
      )}
    </div>
  )
}

