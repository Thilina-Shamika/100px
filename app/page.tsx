import { fetchHeroContent, fetchWordPressServices, fetchWordPressWhyUs, fetchWordPressAdditionalServices, fetchWordPressTestimonials, fetchWordPressFAQ } from "@/lib/wordpress"
import { Hero } from "@/components/hero"
import { AnimatedSection } from "@/components/animated-section"
import { ServicesGrid } from "@/components/services-grid"
import { WhyUs } from "@/components/why-us"
import { AdditionalServices } from "@/components/additional-services"
import { Testimonials } from "@/components/testimonials"
import { FAQ } from "@/components/faq"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Home",
  description: "Capturing Life's Precious Moments with Artistic Excellence - Professional photography services",
}

export default async function Home() {
  const [heroContent, services, whyUsData, additionalServices, testimonials, faqData] = await Promise.all([
    fetchHeroContent(),
    fetchWordPressServices({ fetchAll: true }),
    fetchWordPressWhyUs(),
    fetchWordPressAdditionalServices({ fetchAll: true }),
    fetchWordPressTestimonials({ fetchAll: true }),
    fetchWordPressFAQ(),
  ])

  return (
    <div className="bg-black min-h-screen">
      {/* Hero Section */}
      <Hero
        preHeadline={heroContent.preHeadline}
        headline={heroContent.headline}
        bodyText={heroContent.bodyText}
        heroImage={heroContent.heroImage}
        heroImageAlt={heroContent.heroImageAlt}
        ctaText={heroContent.ctaText}
        ctaLink={heroContent.ctaLink}
      />

      {/* Services Section */}
      {services.length > 0 && (
        <section className="bg-black text-white py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection delay={0.2}>
              <ServicesGrid services={services} />
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* Why Us Section */}
      {whyUsData && (
        <AnimatedSection delay={0.3}>
          <WhyUs whyUsData={whyUsData} />
        </AnimatedSection>
      )}

          {/* Additional Services Section */}
          {additionalServices.length > 0 && (
            <section className="bg-black text-white py-16 sm:py-24">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <AnimatedSection delay={0.4}>
                  <AdditionalServices services={additionalServices} />
                </AnimatedSection>
              </div>
            </section>
          )}

          {/* Testimonials Section */}
          {testimonials.length > 0 && (
            <AnimatedSection delay={0.5}>
              <Testimonials testimonials={testimonials} />
            </AnimatedSection>
          )}

          {/* FAQ Section */}
          {faqData && (
            <AnimatedSection delay={0.6}>
              <FAQ faqData={faqData} />
            </AnimatedSection>
          )}
    </div>
  )
}
