"use client"

import { useState } from "react"
import { WordPressFAQ } from "@/lib/wordpress"
import { ChevronDown } from "lucide-react"

interface FAQProps {
  faqData: WordPressFAQ | null
}

export function FAQ({ faqData }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (!faqData?.acf) {
    return null
  }

  const { heading, sub_heading, faq } = faqData.acf

  if (!heading || !faq || faq.length === 0) {
    return null
  }

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="bg-black text-white py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading and Subheading */}
        <div className="text-center mb-12 sm:mb-16">
          {sub_heading && (
            <p className="text-white/90 uppercase mb-4" style={{ fontSize: '16px', fontWeight: 500 }}>
              {sub_heading}
            </p>
          )}
          
          {heading && (
            <h2 className="text-white" style={{ fontSize: '54px', fontWeight: 400, lineHeight: '54px' }}>
              {heading}
            </h2>
          )}
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto space-y-4">
          {faq.map((item, index) => {
            const isOpen = openIndex === index

            return (
              <div
                key={index}
                className="border border-white/20 rounded-lg overflow-hidden backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/5 to-white/5"
              >
                {/* Question Button */}
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full flex items-center justify-between p-6 sm:p-8 text-left hover:bg-white/5 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-white font-medium pr-8" style={{ fontSize: '20px', lineHeight: '1.2' }}>
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`flex-shrink-0 w-6 h-6 text-white transition-transform duration-300 ${
                      isOpen ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Answer Content */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                    {item.answer && (
                      <p
                        className="text-white/80 whitespace-pre-line"
                        style={{ fontSize: '15px', lineHeight: '1.6' }}
                      >
                        {item.answer}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

