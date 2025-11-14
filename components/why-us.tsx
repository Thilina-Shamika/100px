"use client"

import { WordPressWhyUs } from "@/lib/wordpress"

interface WhyUsProps {
  whyUsData: WordPressWhyUs | null
}

export function WhyUs({ whyUsData }: WhyUsProps) {
  if (!whyUsData?.acf) {
    return null
  }

  const { heading, sub_heading, description, why_us_ } = whyUsData.acf

  if (!heading || !why_us_ || why_us_.length === 0) {
    return null
  }

  return (
    <section className="bg-black text-white py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column - Subheading, Heading, Description */}
          <div className="lg:col-span-4 space-y-6">
            {sub_heading && (
              <p className="text-white/90 uppercase" style={{ fontSize: '16px', fontWeight: 500 }}>
                {sub_heading}
              </p>
            )}
            
            {heading && (
              <h2 className="text-white" style={{ fontSize: '54px', fontWeight: 400, lineHeight: '54px' }}>
                {heading}
              </h2>
            )}
            
            {description && (
              <p className="text-white/80" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                {description}
              </p>
            )}
          </div>

          {/* Right Column - Why Us Items in 3 columns, 2 rows */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {why_us_.map((item, index) => (
              <div key={index} className="flex flex-col space-y-3">
                {/* Number with square background */}
                {item.number && (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-[#B5FF00] rounded">
                    <span className="text-black font-bold" style={{ fontSize: '20px', lineHeight: '1' }}>
                      {item.number}
                    </span>
                  </div>
                )}
                
                {/* Heading */}
                {item.why_us_heading && (
                  <h3 className="text-white font-medium" style={{ fontSize: '20px', lineHeight: '1.2' }}>
                    {item.why_us_heading}
                  </h3>
                )}
                
                {/* Description */}
                {item.description && (
                  <p className="text-white/80" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

