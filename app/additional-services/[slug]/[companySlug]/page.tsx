import { fetchWordPressAdditionalService, fetchWordPressAdditionalServices } from "@/lib/wordpress"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import Image from "next/image"
import { ServiceGallery } from "@/components/service-gallery"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { generateSlug } from "@/lib/utils"
import { ContactUsModalTrigger } from "@/components/contact-us-modal-trigger"

interface AdditionalServiceCompanyPageProps {
  params: Promise<{ slug: string; companySlug: string }>
}

// Force dynamic rendering to handle company slugs that might not be available at build time
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateStaticParams() {
  const services = await fetchWordPressAdditionalServices({ per_page: 100 })
  const params: Array<{ slug: string; companySlug: string }> = []
  
  services.forEach((service) => {
    const companyName = service.acf?.company_name
    if (companyName) {
      const companySlug = generateSlug(companyName)
      if (companySlug) {
        params.push({
          slug: service.slug,
          companySlug: companySlug,
        })
      }
    }
  })
  
  return params
}

export async function generateMetadata({
  params,
}: AdditionalServiceCompanyPageProps): Promise<Metadata> {
  const { slug, companySlug: rawCompanySlug } = await params
  const companySlug = decodeURIComponent(rawCompanySlug)
  const service = await fetchWordPressAdditionalService(slug)

  if (!service) {
    return {
      title: "Gallery Not Found",
    }
  }

  const serviceName = service.acf?.service_name || service.title.rendered
  const companyName = service.acf?.company_name || ""
  const generatedCompanySlug = generateSlug(companyName)

  // Verify the company slug matches
  if (generatedCompanySlug !== companySlug && generatedCompanySlug !== rawCompanySlug) {
    return {
      title: "Gallery Not Found",
    }
  }

  return {
    title: `${serviceName}${companyName ? ` - ${companyName}` : ''} Gallery`,
    description: `Gallery for ${serviceName}${companyName ? ` by ${companyName}` : ''}`,
  }
}

export default async function AdditionalServiceCompanyPage({ params }: AdditionalServiceCompanyPageProps) {
  const { slug, companySlug: rawCompanySlug } = await params
  const companySlug = decodeURIComponent(rawCompanySlug)
  const service = await fetchWordPressAdditionalService(slug)

  if (!service) {
    notFound()
  }

  const serviceName = service.acf?.service_name || service.title.rendered
  const companyName = service.acf?.company_name || ""
  const generatedCompanySlug = generateSlug(companyName)

  // Verify the company slug matches
  if (generatedCompanySlug !== companySlug && generatedCompanySlug !== rawCompanySlug) {
    notFound()
  }

  const servicePrice = service.acf?.price || service.acf?.additional_service_price || ""
  const serviceDescription = service.acf?.description || ""
  const serviceGallery = service.acf?.gallery || []
  const companyLogo = service.acf?.company_logo
  
  const buttonText = service.acf?.button_text || "Contact Us For The Price"

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 sm:pb-12">
        {/* Back Button */}
        <Button
          asChild
          variant="ghost"
          className="mb-6 sm:mb-8 text-white hover:text-[#B5FF00]"
        >
          <Link href={`/additional-services/${slug}`} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to {serviceName}
          </Link>
        </Button>

        {/* Page Title and Subheading */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-white mb-4" style={{ fontSize: '54px', fontWeight: 400, lineHeight: '54px' }}>
            {serviceName}
          </h1>
          
          {/* Company Name and Logo as Subheading */}
          {(companyLogo?.url || companyName) && (
            <div className="flex items-center gap-4 mb-6">
              {companyLogo?.url && (
                <div className="bg-white p-3 rounded-lg">
                  {companyLogo.url.startsWith('http://100px.local') ? (
                    <img
                      src={companyLogo.url}
                      alt={companyName || "Company Logo"}
                      className="h-10 w-auto object-contain max-w-[180px]"
                    />
                  ) : (
                    <Image
                      src={companyLogo.url}
                      alt={companyName || "Company Logo"}
                      width={180}
                      height={40}
                      className="h-10 w-auto object-contain max-w-[180px]"
                    />
                  )}
                </div>
              )}
              {companyName && (
                <h2 className="text-white/80" style={{ fontSize: '18px', fontWeight: 400 }}>
                  {companyName}
                </h2>
              )}
            </div>
          )}
        </div>

        {/* Service Details Section */}
        <div className="mb-12 sm:mb-16">
          <div className="space-y-6 max-w-2xl">
            {/* Service Price */}
            {servicePrice && (
              <p className="text-white" style={{ fontSize: '15px' }}>
                {servicePrice}
              </p>
            )}

            {/* Service Description */}
            {serviceDescription && (
              <div 
                className="text-white/80 prose prose-invert max-w-none"
                style={{ fontSize: '15px' }}
                dangerouslySetInnerHTML={{ __html: serviceDescription }}
              />
            )}

            {/* Button */}
            <div className="pt-4">
              <ContactUsModalTrigger label={buttonText} />
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        {serviceGallery.length > 0 ? (
          <ServiceGallery gallery={serviceGallery} />
        ) : (
          <div className="text-center py-12 sm:py-16">
            <p className="text-white/70">No images in this gallery yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

