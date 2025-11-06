"use client"

import Link from "next/link"
import { Menu, X, CircleArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { cn, mapWordPressUrlToNextRoute } from "@/lib/utils"
import Image from "next/image"
import { WordPressHeader } from "@/lib/wordpress"

interface HeaderProps {
  headerData?: WordPressHeader | null
}

export function Header({ headerData }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Debug logging
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('Header Data:', headerData)
    console.log('ACF Data:', headerData?.acf)
    console.log('Logo URL:', headerData?.acf?.logo?.url)
    console.log('Menu Items:', headerData?.acf?.menu_items)
    console.log('Button Text:', headerData?.acf?.quick_button_text)
    console.log('Button Link:', headerData?.acf?.quick_button_link?.url)
  }

  const logo = headerData?.acf?.logo?.url
  const menuItems = headerData?.acf?.menu_items || []
  const buttonText = headerData?.acf?.quick_button_text || "Book Your Session"
  const buttonLink = headerData?.acf?.quick_button_link?.url || "#"

  // Debug: Show if data is missing
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    if (!headerData) {
      console.warn('⚠️ Header data is null or undefined')
    }
    if (!logo) {
      console.warn('⚠️ Logo URL is missing')
    }
    if (menuItems.length === 0) {
      console.warn('⚠️ Menu items array is empty')
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="relative flex items-center justify-between rounded-full px-6 py-3 backdrop-blur-xl bg-gradient-to-r from-white/10 via-white/5 to-white/10 shadow-2xl">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 z-10 shrink-0">
            {logo ? (
              logo.startsWith('http://100px.local') ? (
                <img
                  src={logo}
                  alt="Logo"
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <Image
                  src={logo}
                  alt="Logo"
                  width={120}
                  height={40}
                  className="h-8 w-auto object-contain"
                  priority
                />
              )
            ) : (
              <div className="flex items-center space-x-0">
                <span className="text-2xl sm:text-3xl font-bold text-white">100</span>
                <span className="text-xl sm:text-2xl font-bold text-[#FF9BFF]">PX</span>
              </div>
            )}
          </Link>
          
          {/* Desktop Navigation - Centered */}
          <nav className="hidden lg:flex items-center gap-6 lg:gap-8 absolute left-1/2 -translate-x-1/2">
            {menuItems && menuItems.length > 0 ? (
              menuItems.map((item) => {
                const wordPressUrl = item.menu_item_link?.url || "#"
                const href = mapWordPressUrlToNextRoute(wordPressUrl)
                const isActive = pathname === href || (href === "/" && pathname === "/")
                return (
                  <Link
                    key={item.menu_item_name}
                    href={href}
                    className={cn(
                      "text-[12px] font-medium transition-colors whitespace-nowrap uppercase",
                      isActive ? "text-[#B5FF00]" : "text-white hover:text-[#B5FF00]"
                    )}
                  >
                    {item.menu_item_name}
                  </Link>
                )
              })
            ) : (
              // Fallback navigation if no menu items
              <>
                <Link href="/" className="text-[12px] font-medium transition-colors text-white hover:text-[#B5FF00] whitespace-nowrap uppercase">
                  Home
                </Link>
                <Link href="/about" className="text-[12px] font-medium transition-colors text-white hover:text-[#B5FF00] whitespace-nowrap uppercase">
                  About us
                </Link>
                <Link href="/services" className="text-[12px] font-medium transition-colors text-white hover:text-[#B5FF00] whitespace-nowrap uppercase">
                  Services
                </Link>
                <Link href="/gallery" className="text-[12px] font-medium transition-colors text-white hover:text-[#B5FF00] whitespace-nowrap uppercase">
                  Gallery
                </Link>
                <Link href="/contact" className="text-[12px] font-medium transition-colors text-white hover:text-[#B5FF00] whitespace-nowrap uppercase">
                  Contact Us
                </Link>
              </>
            )}
          </nav>

          {/* Desktop CTA Button */}
          <div className="hidden lg:block z-10 shrink-0">
            <Button
              asChild
              size="default"
              className="bg-[#B5FF00] hover:bg-[#9FE000] text-black font-semibold hover:shadow-lg hover:shadow-[#B5FF00]/50 group"
            >
              <a href={buttonLink} className="flex items-center gap-2">
                <CircleArrowRight className="group-hover:translate-x-1 transition-transform" />
                <span className="uppercase font-medium">{buttonText}</span>
              </a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white z-10 shrink-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl backdrop-blur-xl bg-gradient-to-r from-white/10 via-white/5 to-white/10 shadow-2xl p-6 lg:hidden">
              <nav className="flex flex-col space-y-4">
                {menuItems && menuItems.length > 0 ? (
                  menuItems.map((item) => {
                    const wordPressUrl = item.menu_item_link?.url || "#"
                    const href = mapWordPressUrlToNextRoute(wordPressUrl)
                    const isActive = pathname === href || (href === "/" && pathname === "/")
                    return (
                      <Link
                        key={item.menu_item_name}
                        href={href}
                        className={cn(
                          "text-[12px] font-medium transition-colors py-2 uppercase",
                          isActive ? "text-[#B5FF00]" : "text-white hover:text-[#B5FF00]"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.menu_item_name}
                      </Link>
                    )
                  })
                ) : (
                  // Fallback navigation
                  <>
                    <Link href="/" className="text-[12px] font-medium transition-colors text-white hover:text-[#B5FF00] py-2 uppercase" onClick={() => setMobileMenuOpen(false)}>
                      Home
                    </Link>
                    <Link href="/about" className="text-[12px] font-medium transition-colors text-white hover:text-[#B5FF00] py-2 uppercase" onClick={() => setMobileMenuOpen(false)}>
                      About us
                    </Link>
                    <Link href="/services" className="text-[12px] font-medium transition-colors text-white hover:text-[#B5FF00] py-2 uppercase" onClick={() => setMobileMenuOpen(false)}>
                      Services
                    </Link>
                    <Link href="/gallery" className="text-[12px] font-medium transition-colors text-white hover:text-[#B5FF00] py-2 uppercase" onClick={() => setMobileMenuOpen(false)}>
                      Gallery
                    </Link>
                    <Link href="/contact" className="text-[12px] font-medium transition-colors text-white hover:text-[#B5FF00] py-2 uppercase" onClick={() => setMobileMenuOpen(false)}>
                      Contact Us
                    </Link>
                  </>
                )}
                <Button
                  asChild
                  size="default"
                  className="bg-[#B5FF00] hover:bg-[#9FE000] text-black font-semibold hover:shadow-lg hover:shadow-[#B5FF00]/50 mt-4 w-full group"
                >
                  <a href={buttonLink} onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2">
                    <CircleArrowRight className="group-hover:translate-x-1 transition-transform" />
                    <span className="uppercase font-medium">{buttonText}</span>
                  </a>
                </Button>
              </nav>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
