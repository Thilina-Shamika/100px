import { fetchWordPressAdditionalService, fetchWordPressAdditionalServices } from "@/lib/wordpress"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { generateSlug } from "@/lib/utils"

interface AdditionalServicePageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const services = await fetchWordPressAdditionalServices({ per_page: 100 })
  return services.map((service) => ({
    slug: service.slug,
  }))
}

export async function generateMetadata({
  params,
}: AdditionalServicePageProps): Promise<Metadata> {
  const { slug } = await params
  const service = await fetchWordPressAdditionalService(slug)

  if (!service) {
    return {
      title: "Service Not Found",
    }
  }

  const serviceName = service.acf?.service_name || service.title.rendered

  return {
    title: serviceName,
    description: service.acf?.description || `Professional ${serviceName} services`,
  }
}

export default async function AdditionalServicePage({ params }: AdditionalServicePageProps) {
  const { slug } = await params
  const service = await fetchWordPressAdditionalService(slug)

  if (!service) {
    notFound()
  }

  const serviceName = service.acf?.service_name || service.title.rendered
  const companyLogo = service.acf?.company_logo
  const companyName = service.acf?.company_name || ""
  const companySlug = companyName ? generateSlug(companyName) : ""

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 sm:pb-12">
        {/* Service Name Heading - Centered */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-white mb-4" style={{ fontSize: '54px', fontWeight: 400, lineHeight: '54px' }}>
            {serviceName}
          </h1>
          <h2 className="text-white/80" style={{ fontSize: '18px', fontWeight: 400 }}>
            Our Client List
          </h2>
        </div>

        {/* Company Logo and Name Box - Clickable to open gallery */}
        {(companyLogo?.url || companyName) && companySlug && (
          <div className="flex justify-center">
            <Link 
              href={`/additional-services/${slug}/${companySlug}`}
              className="inline-block group"
            >
              <div className="bg-white p-4 sm:p-5 rounded-lg w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center justify-center">
                {companyLogo?.url && (
                  <div className="mb-3 flex-1 flex items-center justify-center">
                    {companyLogo.url.startsWith('http://100px.local') ? (
                      <img
                        src={companyLogo.url}
                        alt={companyName || "Company Logo"}
                        className="max-h-[120px] sm:max-h-[140px] w-auto object-contain max-w-full group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Image
                        src={companyLogo.url}
                        alt={companyName || "Company Logo"}
                        width={140}
                        height={140}
                        className="max-h-[120px] sm:max-h-[140px] w-auto object-contain max-w-full group-hover:scale-105 transition-transform"
                      />
                    )}
                  </div>
                )}
                {companyName && (
                  <p className="text-black text-center" style={{ fontSize: '13px', fontWeight: 500 }}>
                    {companyName}
                  </p>
                )}
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

