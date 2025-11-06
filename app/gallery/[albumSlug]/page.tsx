import { fetchWordPressGalleryPage } from "@/lib/wordpress"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { ServiceGallery } from "@/components/service-gallery"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { generateSlug } from "@/lib/utils"

interface GalleryAlbumPageProps {
  params: Promise<{ albumSlug: string }>
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({
  params,
}: GalleryAlbumPageProps): Promise<Metadata> {
  const { albumSlug: rawAlbumSlug } = await params
  const albumSlug = decodeURIComponent(rawAlbumSlug)
  const galleryPage = await fetchWordPressGalleryPage()

  if (!galleryPage) {
    return {
      title: "Album Not Found",
    }
  }

  const acf = galleryPage.acf as any
  const galleryItems = acf?.gallery_items || []
  const album = galleryItems.find(
    (a: any) => generateSlug(a.album_name) === albumSlug
  )
  const albumName = album?.album_name || "Album"

  return {
    title: `${albumName} - Gallery`,
    description: `Gallery album: ${albumName}`,
  }
}

export default async function GalleryAlbumPage({ params }: GalleryAlbumPageProps) {
  const { albumSlug: rawAlbumSlug } = await params
  const albumSlug = decodeURIComponent(rawAlbumSlug)
  
  const galleryPage = await fetchWordPressGalleryPage()

  if (!galleryPage) {
    notFound()
  }

  const acf = galleryPage.acf as any
  const galleryItems = acf?.gallery_items || []
  
  const album = galleryItems.find(
    (a: any) => {
      const generatedSlug = generateSlug(a.album_name)
      return generatedSlug === albumSlug || generatedSlug === rawAlbumSlug
    }
  )

  if (!album) {
    notFound()
  }

  const albumName = album.album_name || "Album"
  const albumGallery = album.gallery_images || []

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 sm:pb-12">
        {/* Back Button */}
        <Button
          asChild
          variant="ghost"
          className="mb-6 sm:mb-8 text-white hover:text-[#B5FF00]"
        >
          <Link href="/gallery" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Gallery
          </Link>
        </Button>

        {/* Page Title and Subheading */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-white mb-4" style={{ fontSize: '54px', fontWeight: 400, lineHeight: '54px' }}>
            Gallery
          </h1>
          <h2 className="text-white/80" style={{ fontSize: '18px', fontWeight: 400 }}>
            {albumName}
          </h2>
        </div>

        {/* Gallery Section */}
        {albumGallery.length > 0 ? (
          <ServiceGallery gallery={albumGallery} />
        ) : (
          <div className="text-center py-12 sm:py-16">
            <p className="text-white/70">No images in this album yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

