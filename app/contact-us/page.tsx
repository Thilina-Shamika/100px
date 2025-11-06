import { fetchWordPressContactPage } from "@/lib/wordpress"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import Image from "next/image"
import { ContactForm } from "@/components/contact-form"
import { Phone, MapPin, MessageCircle, Mail, Clock } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with 100px - Feel free to contact us for inquiries",
}

// Icon mapping for contact info
const getContactIcon = (name: string) => {
  const normalizedName = name.toLowerCase()
  if (normalizedName.includes('phone')) return Phone
  if (normalizedName.includes('address')) return MapPin
  if (normalizedName.includes('whatsapp')) return MessageCircle
  if (normalizedName.includes('email')) return Mail
  if (normalizedName.includes('open hours') || normalizedName.includes('hours')) return Clock
  return null
}

export default async function ContactPage() {
  const contactPage = await fetchWordPressContactPage()

  if (!contactPage) {
    notFound()
  }

  const acf = contactPage.acf as any
  const headerImage = acf?.header_image
  const heading = acf?.heading || "Contact Us"
  const subheading = acf?.subheading || "Feel Free to contact us for inquiries"
  const description = acf?.description || "Send us a message using our contact form or send us messages on any social media."
  const iconGroups = acf?.icon_groups || []
  const mapLink = acf?.map_link

  return (
    <div className="bg-black min-h-screen text-white">
      {/* Header Image Section */}
      {headerImage?.url && (
        <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden">
          {headerImage.url.startsWith('http://100px.local') || headerImage.url.startsWith('https://website.100px.lk') ? (
            <img
              src={headerImage.url}
              alt={headerImage.alt || "Contact Us"}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={headerImage.url}
              alt={headerImage.alt || "Contact Us"}
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

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        {/* Description */}
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-white/80 max-w-2xl mx-auto" style={{ fontSize: '15px' }}>
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Contact Information Cards */}
          <div className="space-y-6">
            {iconGroups.map((group: any, index: number) => {
              const IconComponent = getContactIcon(group.name || '')
              const normalizedName = (group.name || '').toLowerCase()
              
              return (
                <div
                  key={index}
                  className="relative p-6 sm:p-8 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-white/5 to-white/10 border border-white/20 shadow-lg"
                >
                  <div className="flex items-start gap-4 sm:gap-6">
                    {IconComponent && (
                      <div className="shrink-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#B5FF00]/20 flex items-center justify-center">
                          <IconComponent className="h-6 w-6 sm:h-7 sm:w-7 text-[#B5FF00]" />
                        </div>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">
                        {group.name}
                      </h3>
                      {normalizedName.includes('phone') ? (
                        <a
                          href={`tel:${group.description?.replace(/\s/g, '')}`}
                          className="text-white/80 text-sm sm:text-base hover:text-[#B5FF00] transition-colors block"
                        >
                          {group.description}
                        </a>
                      ) : normalizedName.includes('whatsapp') ? (
                        <a
                          href={group.link || `https://wa.me/${group.description?.replace(/[^\d]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/80 text-sm sm:text-base hover:text-[#B5FF00] transition-colors block"
                        >
                          {group.description}
                        </a>
                      ) : normalizedName.includes('email') ? (
                        <a
                          href={`mailto:${group.description}`}
                          className="text-white/80 text-sm sm:text-base hover:text-[#B5FF00] transition-colors block"
                        >
                          {group.description}
                        </a>
                      ) : normalizedName.includes('address') && mapLink ? (
                        <Link
                          href={mapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/80 text-sm sm:text-base hover:text-[#B5FF00] transition-colors block whitespace-pre-line"
                        >
                          {group.description}
                        </Link>
                      ) : (
                        <p className="text-white/80 text-sm sm:text-base whitespace-pre-line">
                          {group.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Map Link Button */}
            {mapLink && (
              <Link
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full p-6 sm:p-8 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-white/5 to-white/10 border border-white/20 shadow-lg hover:border-[#B5FF00]/50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#B5FF00]/20 flex items-center justify-center group-hover:bg-[#B5FF00]/30 transition-colors">
                    <MapPin className="h-6 w-6 sm:h-7 sm:w-7 text-[#B5FF00]" />
                  </div>
                  <div>
                    <h3 className="text-white text-lg sm:text-xl font-semibold mb-1">
                      View on Map
                    </h3>
                    <p className="text-white/70 text-sm">
                      Click to open in Google Maps
                    </p>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Right Column - Contact Form */}
          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  )
}

