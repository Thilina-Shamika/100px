// WordPress API client for headless CMS

export interface WordPressPost {
  id: number
  date: string
  date_gmt: string
  modified: string
  modified_gmt: string
  slug: string
  status: string
  type: string
  link: string
  title: {
    rendered: string
  }
  content: {
    rendered: string
    protected: boolean
  }
  excerpt: {
    rendered: string
    protected: boolean
  }
  featured_media: number
  categories: number[]
  tags: number[]
  author: number
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string
      alt_text: string
      media_details: {
        width: number
        height: number
        sizes: {
          [key: string]: {
            source_url: string
            width: number
            height: number
          }
        }
      }
    }>
    'wp:term'?: Array<Array<{
      id: number
      name: string
      slug: string
    }>>
    author?: Array<{
      name: string
      slug: string
    }>
  }
}

export interface WordPressMedia {
  id: number
  source_url: string
  alt_text: string
  media_details: {
    width: number
    height: number
    sizes: {
      [key: string]: {
        source_url: string
        width: number
        height: number
      }
    }
  }
}

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || ''
const WORDPRESS_API_KEY = process.env.WORDPRESS_API_KEY || ''

if (!WORDPRESS_API_URL) {
  console.warn('NEXT_PUBLIC_WORDPRESS_API_URL is not set')
}

const WORDPRESS_MEDIA_BASE_REFERENCE =
  process.env.NEXT_PUBLIC_WORDPRESS_MEDIA_BASE_URL || WORDPRESS_API_URL

function getWordPressMediaBase(): string | null {
  if (!WORDPRESS_MEDIA_BASE_REFERENCE) {
    return null
  }

  try {
    const parsed = new URL(WORDPRESS_MEDIA_BASE_REFERENCE)
    return parsed.origin
  } catch (error) {
    console.warn('Unable to determine WordPress media base URL:', error)
    return null
  }
}

function shouldRewriteMediaHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase()
  return (
    normalized.endsWith('.local') ||
    normalized === 'localhost' ||
    normalized === '127.0.0.1'
  )
}

export function normalizeWordPressMediaUrl(url?: string | null): string | undefined {
  if (!url) {
    return undefined
  }

  const trimmedUrl = url.trim()

  if (!trimmedUrl) {
    return undefined
  }

  const mediaBase = getWordPressMediaBase()

  let parsed: URL
  try {
    parsed = mediaBase ? new URL(trimmedUrl, mediaBase) : new URL(trimmedUrl)
  } catch {
    if (mediaBase) {
      return `${mediaBase.replace(/\/$/, '')}/${trimmedUrl.replace(/^\/+/, '')}`
    }
    return trimmedUrl
  }

  if (shouldRewriteMediaHost(parsed.hostname)) {
    if (!mediaBase) {
      return parsed.toString()
    }

    const baseUrl = new URL(mediaBase)
    parsed.protocol = baseUrl.protocol
    parsed.hostname = baseUrl.hostname
    parsed.port = baseUrl.port
    return parsed.toString()
  }

  return parsed.toString()
}

export async function fetchWordPressPosts(params?: {
  per_page?: number
  page?: number
  categories?: number[]
  search?: string
}): Promise<WordPressPost[]> {
  try {
    if (!WORDPRESS_API_URL) {
      console.error('NEXT_PUBLIC_WORDPRESS_API_URL is not set in environment variables')
      return []
    }

    const searchParams = new URLSearchParams()
    
    if (params?.per_page) {
      searchParams.set('per_page', params.per_page.toString())
    }
    if (params?.page) {
      searchParams.set('page', params.page.toString())
    }
    if (params?.categories) {
      searchParams.set('categories', params.categories.join(','))
    }
    if (params?.search) {
      searchParams.set('search', params.search)
    }
    
    // Request embedded media and author data
    searchParams.set('_embed', 'true')
    
    const url = `${WORDPRESS_API_URL}/wp-json/wp/v2/posts?${searchParams.toString()}`
    
    console.log('Fetching WordPress posts from:', url)
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (WORDPRESS_API_KEY) {
      headers['Authorization'] = `Bearer ${WORDPRESS_API_KEY}`
    }
    
    const response = await fetch(url, {
      headers,
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`WordPress API error (${response.status}):`, response.statusText, errorText)
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log(`Successfully fetched ${data.length} posts from WordPress`)
    return data
  } catch (error) {
    console.error('Error fetching WordPress posts:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    return []
  }
}

export async function fetchWordPressPost(slug: string): Promise<WordPressPost | null> {
  try {
    const searchParams = new URLSearchParams()
    searchParams.set('slug', slug)
    searchParams.set('_embed', 'true')
    
    const url = `${WORDPRESS_API_URL}/wp-json/wp/v2/posts?${searchParams.toString()}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (WORDPRESS_API_KEY) {
      headers['Authorization'] = `Bearer ${WORDPRESS_API_KEY}`
    }
    
    const response = await fetch(url, {
      headers,
      next: { revalidate: 60 },
    })
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.statusText}`)
    }
    
    const posts = await response.json()
    return posts.length > 0 ? posts[0] : null
  } catch (error) {
    console.error('Error fetching WordPress post:', error)
    return null
  }
}

export async function fetchWordPressMedia(id: number): Promise<WordPressMedia | null> {
  try {
    const url = `${WORDPRESS_API_URL}/wp-json/wp/v2/media/${id}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (WORDPRESS_API_KEY) {
      headers['Authorization'] = `Bearer ${WORDPRESS_API_KEY}`
    }
    
    const response = await fetch(url, {
      headers,
      next: { revalidate: 3600 }, // Cache media for 1 hour
    })
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching WordPress media:', error)
    return null
  }
}

export function getFeaturedImage(post: WordPressPost): string | null {
  if (!post._embedded?.['wp:featuredmedia']?.[0]) {
    return null
  }
  
  const media = post._embedded['wp:featuredmedia'][0]
  return media.source_url || null
}

export function getImageAlt(post: WordPressPost): string {
  if (!post._embedded?.['wp:featuredmedia']?.[0]) {
    return post.title.rendered
  }
  
  const media = post._embedded['wp:featuredmedia'][0]
  return media.alt_text || post.title.rendered
}

export interface ACFBackgroundImage {
  ID: number
  url: string
  alt?: string
  width?: number
  height?: number
  sizes?: {
    [key: string]: {
      url: string
      width: number
      height: number
    }
  }
}

function normalizeAcfBackgroundImage(image?: ACFBackgroundImage | null): ACFBackgroundImage | undefined {
  if (!image) {
    return image ?? undefined
  }

  const normalizedImage: ACFBackgroundImage = {
    ...image,
    url: normalizeWordPressMediaUrl(image.url) ?? image.url,
  }

  if (image.sizes) {
    normalizedImage.sizes = Object.fromEntries(
      Object.entries(image.sizes).map(([sizeKey, sizeValue]) => [
        sizeKey,
        {
          ...sizeValue,
          url: normalizeWordPressMediaUrl(sizeValue.url) ?? sizeValue.url,
        },
      ]),
    )
  }

  return normalizedImage
}

export interface ACFHeroFields {
  background_image?: ACFBackgroundImage
  hero_subheading?: string
  hero_heading?: string
  hero_description?: string
  hero_button_text?: string
  hero_button_link?: string
  service_name?: string
  service_description?: string
  service_image?: ACFBackgroundImage
  service_subheading?: string
  service_heading?: string
  service_button_text?: string
  service_button_link?: ACFMenuLink
}

export interface ACFContactIconGroup {
  acf_fc_layout: string
  name?: string
  description?: string
  link?: string
}

export interface ACFContactFields {
  header_image?: ACFBackgroundImage
  heading?: string
  subheading?: string
  description?: string
  icon_groups?: ACFContactIconGroup[]
  map_link?: string
}

export interface ACFGalleryAlbum {
  acf_fc_layout: string
  album_cover_image?: ACFBackgroundImage
  album_name?: string
  gallery_images?: ACFBackgroundImage[]
}

export interface ACFGalleryFields {
  heading?: string
  subheading?: string
  background_image?: ACFBackgroundImage
  gallery_items?: ACFGalleryAlbum[]
}

export interface ACFServicesPageFields {
  heading?: string
  sub_heading?: string
  background_image?: ACFBackgroundImage
}

export interface WordPressPage {
  id: number
  date: string
  date_gmt: string
  modified: string
  modified_gmt: string
  slug: string
  status: string
  type: string
  link: string
  title: {
    rendered: string
  }
  content: {
    rendered: string
    protected: boolean
  }
  excerpt: {
    rendered: string
    protected: boolean
  }
  featured_media: number
  acf?: ACFHeroFields | ACFContactFields | ACFGalleryFields | ACFServicesPageFields
}

export interface ACFMenuLink {
  title: string
  url: string
  target: string
}

export interface ACFMenuItem {
  acf_fc_layout: string
  menu_item_name: string
  menu_item_link: ACFMenuLink
}

export interface ACFHeaderFields {
  logo?: ACFBackgroundImage
  menu_items?: ACFMenuItem[]
  quick_button_text?: string
  quick_button_link?: ACFMenuLink
}

export interface ACFFooterMenuItem {
  acf_fc_layout: string
  menu_item_name: string
  menu_item_link: ACFMenuLink
}

export interface ACFFooterImportantLink {
  acf_fc_layout: string
  important_link_text: string
  important_links: ACFMenuLink
}

export interface ACFFooterIconGroup {
  acf_fc_layout: string
  list_name: string
  list_content: string
}

export interface ACFFooterSocialMedia {
  acf_fc_layout: string
  social_media_name: string
  social_media_links_items: ACFMenuLink
}

export interface ACFFooterFields {
  logo?: ACFBackgroundImage
  menu?: ACFFooterMenuItem[]
  important_links?: ACFFooterImportantLink[]
  icon_groups?: ACFFooterIconGroup[]
  social_media?: ACFFooterSocialMedia[]
}

export interface WordPressFooter {
  id: number
  date: string
  date_gmt: string
  modified: string
  modified_gmt: string
  slug: string
  status: string
  type: string
  link: string
  title: {
    rendered: string
  }
  content: {
    rendered: string
    protected: boolean
  }
  featured_media: number
  acf?: ACFFooterFields
}

export interface WordPressHeader {
  id: number
  date: string
  date_gmt: string
  modified: string
  modified_gmt: string
  slug: string
  status: string
  type: string
  link: string
  title: {
    rendered: string
  }
  content: {
    rendered: string
    protected: boolean
  }
  featured_media: number
  acf?: ACFHeaderFields
}

export interface ACFServiceAlbum {
  album_name?: string
  album_cover?: ACFBackgroundImage
  service_gallery?: ACFBackgroundImage[]
}

export interface ACFServiceFields {
  service_name?: string
  service_price?: string
  additional_charges?: string
  service_description?: string
  service_image?: ACFBackgroundImage
  service_gallery?: ACFBackgroundImage[]
  albums?: ACFServiceAlbum[]
  service_button_text?: string
  service_button_link?: ACFMenuLink
}

export interface WordPressService {
  id: number
  date: string
  date_gmt: string
  modified: string
  modified_gmt: string
  slug: string
  status: string
  type: string
  link: string
  title: {
    rendered: string
  }
  content: {
    rendered: string
    protected: boolean
  }
  featured_media: number
  acf?: ACFServiceFields
}

export interface HeroContent {
  preHeadline?: string
  headline?: string
  bodyText?: string
  heroImage?: string
  heroImageAlt?: string
  ctaText?: string
  ctaLink?: string
}

export interface SameDayServiceContent {
  serviceName?: string
  serviceDescription?: string
  serviceImage?: {
    url?: string
    alt?: string
  }
  serviceSubheading?: string
  serviceHeading?: string
  serviceButtonText?: string
  serviceButtonLink?: string
}

export interface ACFAdditionalServiceFields {
  service_name?: string
  price?: string
  additional_service_price?: string
  service_image?: ACFBackgroundImage
  description?: string
  gallery?: ACFBackgroundImage[]
  company_logo?: ACFBackgroundImage
  company_name?: string
  button_text?: string
  button_link?: ACFMenuLink
}

export interface ACFTestimonialFields {
  client_name?: string
  designation?: string
  profile_picture?: ACFBackgroundImage
  testimonial_heading?: string
  testimonial?: string
}

export interface WordPressAdditionalService {
  id: number
  date: string
  date_gmt: string
  modified: string
  modified_gmt: string
  slug: string
  status: string
  type: string
  link: string
  title: {
    rendered: string
  }
  content: {
    rendered: string
    protected: boolean
  }
  featured_media: number
  acf?: ACFAdditionalServiceFields
}

export interface WordPressTestimonial {
  id: number
  date: string
  date_gmt: string
  modified: string
  modified_gmt: string
  slug: string
  status: string
  type: string
  link: string
  title: {
    rendered: string
  }
  content: {
    rendered: string
    protected: boolean
  }
  featured_media: number
  acf?: ACFTestimonialFields
}

export interface ACFWhyUsItem {
  acf_fc_layout: string
  number?: string
  why_us_heading?: string
  description?: string
}

export interface ACFWhyUsFields {
  heading?: string
  sub_heading?: string
  description?: string
  why_us_?: ACFWhyUsItem[]
}

export interface WordPressWhyUs {
  id: number
  date: string
  date_gmt: string
  modified: string
  modified_gmt: string
  slug: string
  status: string
  type: string
  link: string
  title: {
    rendered: string
  }
  content: {
    rendered: string
    protected: boolean
  }
  featured_media: number
  acf?: ACFWhyUsFields
}

export interface ACFFAQItem {
  acf_fc_layout: string
  question?: string
  answer?: string
}

export interface ACFFAQFields {
  heading?: string
  sub_heading?: string
  faq?: ACFFAQItem[]
}

export interface WordPressFAQ {
  id: number
  date: string
  date_gmt: string
  modified: string
  modified_gmt: string
  slug: string
  status: string
  type: string
  link: string
  title: {
    rendered: string
  }
  content: {
    rendered: string
    protected: boolean
  }
  featured_media: number
  acf?: ACFFAQFields
}

export async function fetchWordPressPage(slug: string): Promise<WordPressPage | null> {
  try {
    if (!WORDPRESS_API_URL) {
      console.error('NEXT_PUBLIC_WORDPRESS_API_URL is not set in environment variables')
      return null
    }

    const url = `${WORDPRESS_API_URL}/wp-json/wp/v2/pages?slug=${slug}`
    
    console.log('Fetching WordPress page from:', url)
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (WORDPRESS_API_KEY) {
      headers['Authorization'] = `Bearer ${WORDPRESS_API_KEY}`
    }
    
    const response = await fetch(url, {
      headers,
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`WordPress API error (${response.status}):`, response.statusText, errorText)
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
    }
    
    const pages = await response.json()
    
    if (!pages || pages.length === 0) {
      console.log(`No page found with slug: ${slug}`)
      return null
    }
    
    return pages[0] as WordPressPage
  } catch (error) {
    console.error('Error fetching WordPress page:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    return null
  }
}

export async function fetchWordPressHeader(): Promise<WordPressHeader | null> {
  try {
    if (!WORDPRESS_API_URL) {
      console.error('NEXT_PUBLIC_WORDPRESS_API_URL is not set in environment variables')
      return null
    }

    const url = `${WORDPRESS_API_URL}/wp-json/wp/v2/header?slug=header`
    
    console.log('Fetching WordPress header from:', url)
    
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (WORDPRESS_API_KEY) {
      requestHeaders['Authorization'] = `Bearer ${WORDPRESS_API_KEY}`
    }
    
    const response = await fetch(url, {
      headers: requestHeaders,
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`WordPress API error (${response.status}):`, response.statusText, errorText)
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
    }
    
    const headerData = await response.json()
    
    console.log('Header API Response:', JSON.stringify(headerData, null, 2))
    
    if (!headerData || headerData.length === 0) {
      console.log('No header found')
      return null
    }
    
    const header = headerData[0] as WordPressHeader
    console.log('Parsed Header:', {
      id: header.id,
      hasACF: !!header.acf,
      logoUrl: header.acf?.logo?.url,
      menuItemsCount: header.acf?.menu_items?.length,
      buttonText: header.acf?.quick_button_text,
    })
    
    const normalizedHeader: WordPressHeader = header.acf
      ? {
          ...header,
          acf: {
            ...header.acf,
            logo: normalizeAcfBackgroundImage(header.acf.logo),
          },
        }
      : header
    
    return normalizedHeader
  } catch (error) {
    console.error('Error fetching WordPress header:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    return null
  }
}

export async function fetchWordPressGalleryPage(): Promise<WordPressPage | null> {
  try {
    if (!WORDPRESS_API_URL) {
      console.error('NEXT_PUBLIC_WORDPRESS_API_URL is not set in environment variables')
      return null
    }

    const url = `${WORDPRESS_API_URL}/wp-json/wp/v2/pages?slug=gallery`
    
    console.log('Fetching WordPress gallery page from:', url)
    
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (WORDPRESS_API_KEY) {
      requestHeaders['Authorization'] = `Bearer ${WORDPRESS_API_KEY}`
    }
    
    const response = await fetch(url, {
      headers: requestHeaders,
      next: { revalidate: 300 },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`WordPress API error (${response.status}):`, response.statusText, errorText)
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
    }
    
    const pages = await response.json()
    
    if (!pages || pages.length === 0) {
      console.log('No gallery page found')
      return null
    }
    
    return pages[0] as WordPressPage
  } catch (error) {
    console.error('Error fetching WordPress gallery page:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    return null
  }
}

export async function fetchWordPressServicesPage(): Promise<WordPressPage | null> {
  try {
    if (!WORDPRESS_API_URL) {
      console.error('NEXT_PUBLIC_WORDPRESS_API_URL is not set in environment variables')
      return null
    }

    const url = `${WORDPRESS_API_URL}/wp-json/wp/v2/pages?slug=services`
    
    console.log('Fetching WordPress services page from:', url)
    
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (WORDPRESS_API_KEY) {
      requestHeaders['Authorization'] = `Bearer ${WORDPRESS_API_KEY}`
    }
    
    const response = await fetch(url, {
      headers: requestHeaders,
      next: { revalidate: 300 },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`WordPress API error (${response.status}):`, response.statusText, errorText)
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
    }
    
    const pages = await response.json()
    
    if (!pages || pages.length === 0) {
      console.log('No services page found')
      return null
    }
    
    return pages[0] as WordPressPage
  } catch (error) {
    console.error('Error fetching WordPress services page:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    return null
  }
}

export async function fetchWordPressContactPage(): Promise<WordPressPage | null> {
  try {
    if (!WORDPRESS_API_URL) {
      console.error('NEXT_PUBLIC_WORDPRESS_API_URL is not set in environment variables')
      return null
    }

    const url = `${WORDPRESS_API_URL}/wp-json/wp/v2/pages?slug=contact-us`
    
    console.log('Fetching WordPress contact page from:', url)
    
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (WORDPRESS_API_KEY) {
      requestHeaders['Authorization'] = `Bearer ${WORDPRESS_API_KEY}`
    }
    
    const response = await fetch(url, {
      headers: requestHeaders,
      next: { revalidate: 300 },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`WordPress API error (${response.status}):`, response.statusText, errorText)
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
    }
    
    const pages = await response.json()
    
    if (!pages || pages.length === 0) {
      console.log('No contact page found')
      return null
    }
    
    return pages[0] as WordPressPage
  } catch (error) {
    console.error('Error fetching WordPress contact page:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    return null
  }
}

export async function fetchWordPressFooter(): Promise<WordPressFooter | null> {
  try {
    if (!WORDPRESS_API_URL) {
      console.error('NEXT_PUBLIC_WORDPRESS_API_URL is not set in environment variables')
      return null
    }

    const url = `${WORDPRESS_API_URL}/wp-json/wp/v2/footer?slug=footer`
    
    console.log('Fetching WordPress footer from:', url)
    
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (WORDPRESS_API_KEY) {
      requestHeaders['Authorization'] = `Bearer ${WORDPRESS_API_KEY}`
    }
    
    const response = await fetch(url, {
      headers: requestHeaders,
      next: { revalidate: 300 },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`WordPress API error (${response.status}):`, response.statusText, errorText)
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
    }
    
    const footerData = await response.json()
    
    console.log('Footer API Response:', JSON.stringify(footerData, null, 2))
    
    if (!footerData || footerData.length === 0) {
      console.log('No footer found')
      return null
    }
    
    const footer = footerData[0] as WordPressFooter
    console.log('Parsed Footer:', {
      id: footer.id,
      hasACF: !!footer.acf,
      logoUrl: footer.acf?.logo?.url,
      menuItemsCount: footer.acf?.menu?.length,
      socialMediaCount: footer.acf?.social_media?.length,
    })
    
    const normalizedFooter: WordPressFooter = footer.acf
      ? {
          ...footer,
          acf: {
            ...footer.acf,
            logo: normalizeAcfBackgroundImage(footer.acf.logo),
          },
        }
      : footer
    
    return normalizedFooter
  } catch (error) {
    console.error('Error fetching WordPress footer:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    return null
  }
}

export async function fetchWordPressServices(params?: {
  per_page?: number
  page?: number
  fetchAll?: boolean
}): Promise<WordPressService[]> {
  try {
    if (!WORDPRESS_API_URL) {
      console.error('NEXT_PUBLIC_WORDPRESS_API_URL is not set in environment variables')
      return []
    }

    // If fetchAll is true, fetch all pages
    if (params?.fetchAll) {
      const allServices: WordPressService[] = []
      let page = 1
      let hasMore = true
      const perPage = params.per_page || 100

      while (hasMore) {
        const searchParams = new URLSearchParams()
        searchParams.set('per_page', perPage.toString())
        searchParams.set('page', page.toString())

        const url = `${WORDPRESS_API_URL}/wp-json/wp/v2/service?${searchParams.toString()}`

        const requestHeaders: HeadersInit = {
          'Content-Type': 'application/json',
        }

        if (WORDPRESS_API_KEY) {
          requestHeaders['Authorization'] = `Bearer ${WORDPRESS_API_KEY}`
        }

        const response = await fetch(url, {
          headers: requestHeaders,
          next: { revalidate: 300 },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`WordPress API error (${response.status}):`, response.statusText, errorText)
          break
        }

        const data = await response.json()
        allServices.push(...(data as WordPressService[]))

        // Check if there are more pages
        const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10)
        hasMore = page < totalPages && data.length === perPage
        page++

        if (data.length === 0) {
          hasMore = false
        }
      }

      console.log(`Successfully fetched ${allServices.length} services from WordPress (all pages)`)
      return allServices
    }

    // Single page fetch
    const searchParams = new URLSearchParams()

    if (params?.per_page) {
      searchParams.set('per_page', params.per_page.toString())
    }
    if (params?.page) {
      searchParams.set('page', params.page.toString())
    }

    const url = `${WORDPRESS_API_URL}/wp-json/wp/v2/service?${searchParams.toString()}`

    console.log('Fetching WordPress services from:', url)

    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (WORDPRESS_API_KEY) {
      requestHeaders['Authorization'] = `Bearer ${WORDPRESS_API_KEY}`
    }

    const response = await fetch(url, {
      headers: requestHeaders,
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`WordPress API error (${response.status}):`, response.statusText, errorText)
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`Successfully fetched ${data.length} services from WordPress`)
    return data as WordPressService[]
  } catch (error) {
    console.error('Error fetching WordPress services:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    return []
  }
}

export async function fetchWordPressService(slug: string): Promise<WordPressService | null> {
  try {
    if (!WORDPRESS_API_URL) {
      console.error('NEXT_PUBLIC_WORDPRESS_API_URL is not set in environment variables')
      return null
    }

    const url = `${WORDPRESS_API_URL}/wp-json/wp/v2/service?slug=${slug}`

    console.log('Fetching WordPress service from:', url)

    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (WORDPRESS_API_KEY) {
      requestHeaders['Authorization'] = `Bearer ${WORDPRESS_API_KEY}`
    }

    const response = await fetch(url, {
      headers: requestHeaders,
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`WordPress API error (${response.status}):`, response.statusText, errorText)
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
    }

    const services = await response.json()
    return services.length > 0 ? (services[0] as WordPressService) : null
  } catch (error) {
    console.error('Error fetching WordPress service:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    return null
  }
}

export async function fetchHeroContent(): Promise<HeroContent> {
  try {
    if (!WORDPRESS_API_URL) {
      console.error('NEXT_PUBLIC_WORDPRESS_API_URL is not set in environment variables')
      return {}
    }

    // Fetch the "home" page which contains ACF hero fields
    const page = await fetchWordPressPage('home')
    
    // Debug: Log the full page object to see what we're getting
    if (page) {
      console.log('Page fetched:', {
        id: page.id,
        slug: page.slug,
        hasACF: !!page.acf,
        acfKeys: page.acf ? Object.keys(page.acf) : [],
      })
    }
    
    if (!page) {
      console.log('No home page found, using defaults')
      return {
        preHeadline: "Capturing Life's Precious Moments with Artistic Excellence",
        headline: "Your Story, Our Lens",
        bodyText: "From stunning portraits to timeless family memories, corporate headshots to vibrant fashion shoots—every image tells your unique story. Discover professional photography services in Colombo, designed to beautifully preserve your most cherished moments.",
        ctaText: "BOOK YOUR SESSION",
        ctaLink: "/contact",
      }
    }
    
    const acf = page.acf as ACFHeroFields | undefined
    
    // If ACF is not available, warn and use defaults
    if (!acf) {
      console.warn('⚠️ ACF fields not found in page object.')
      console.warn('To fix this, enable ACF REST API. See ACF_SETUP.md for instructions.')
      console.log('Page object keys:', Object.keys(page))
      
      // Use defaults but you can manually set the image URL here as a temporary fix
      return {
        preHeadline: "Capturing Life's Precious Moments with Artistic Excellence",
        headline: "Your Story, Our Lens",
        bodyText: "From stunning portraits to timeless family memories, corporate headshots to vibrant fashion shoots—every image tells your unique story. Discover professional photography services in Colombo, designed to beautifully preserve your most cherished moments.",
        // TEMPORARY: Manually set your background image URL here until ACF is enabled
        heroImage: process.env.NEXT_PUBLIC_HERO_IMAGE_URL || undefined,
        heroImageAlt: "Hero background",
        ctaText: "BOOK YOUR SESSION",
        ctaLink: "/contact",
      }
    }
    
    console.log('✅ Hero content fetched successfully from ACF:', {
      hasBackgroundImage: !!acf?.background_image,
      backgroundImageUrl: acf?.background_image?.url,
      hasHeading: !!acf?.hero_heading,
    })
    
    return {
      preHeadline: acf?.hero_subheading || "Capturing Life's Precious Moments with Artistic Excellence",
      headline: acf?.hero_heading || "Your Story, Our Lens",
      bodyText: acf?.hero_description || "From stunning portraits to timeless family memories, corporate headshots to vibrant fashion shoots—every image tells your unique story.",
      heroImage: acf?.background_image?.url || process.env.NEXT_PUBLIC_HERO_IMAGE_URL || undefined,
      heroImageAlt: acf?.background_image?.alt || "Hero background",
      ctaText: acf?.hero_button_text || "BOOK YOUR SESSION",
      ctaLink: acf?.hero_button_link || "/contact",
    }
  } catch (error) {
    console.error('Error fetching hero content:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    return {}
  }
}

export async function fetchSameDayServiceContent(): Promise<SameDayServiceContent> {
  try {
    if (!WORDPRESS_API_URL) {
      console.error('NEXT_PUBLIC_WORDPRESS_API_URL is not set in environment variables')
      return {}
    }

    // Fetch the "home" page which contains ACF same day service fields
    const page = await fetchWordPressPage('home')
    
    if (!page || !page.acf) {
      console.log('No home page or ACF fields found for same day service')
      return {}
    }
    
        const acf = page.acf as ACFHeroFields | undefined
        
        return {
          serviceName: acf?.service_name || undefined,
          serviceDescription: acf?.service_description || undefined,
          serviceImage: acf?.service_image ? {
            url: acf.service_image.url,
            alt: acf.service_image.alt || undefined,
          } : undefined,
          serviceSubheading: acf?.service_subheading || undefined,
          serviceHeading: acf?.service_heading || undefined,
          serviceButtonText: acf?.service_button_text || undefined,
          serviceButtonLink: acf?.service_button_link?.url || undefined,
        }
  } catch (error) {
    console.error('Error fetching same day service content:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    return {}
  }
}

export async function fetchWordPressAdditionalServices(params?: {
  per_page?: number
  page?: number
  fetchAll?: boolean
}): Promise<WordPressAdditionalService[]> {
  try {
    if (!WORDPRESS_API_URL) {
      console.error('NEXT_PUBLIC_WORDPRESS_API_URL is not set in environment variables')
      return []
    }

    // If fetchAll is true, fetch all pages
    if (params?.fetchAll) {
      const allServices: WordPressAdditionalService[] = []
      let page = 1
      let hasMore = true
      const perPage = params.per_page || 100

      while (hasMore) {
        const searchParams = new URLSearchParams()
        searchParams.set('per_page', perPage.toString())
        searchParams.set('page', page.toString())

        const url = `${WORDPRESS_API_URL}/wp-json/wp/v2/additional-service?${searchParams.toString()}`

        const requestHeaders: HeadersInit = {
          'Content-Type': 'application/json',
        }

        if (WORDPRESS_API_KEY) {
          requestHeaders['Authorization'] = `Bearer ${WORDPRESS_API_KEY}`
        }

        const response = await fetch(url, {
          headers: requestHeaders,
          next: { revalidate: 300 },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`WordPress API error (${response.status}):`, response.statusText, errorText)
          break
        }

        const data = await response.json()
        allServices.push(...(data as WordPressAdditionalService[]))

        // Check if there are more pages
        const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10)
        hasMore = page < totalPages && data.length === perPage
        page++

        if (data.length === 0) {
          hasMore = false
        }
      }

      console.log(`Successfully fetched ${allServices.length} additional services from WordPress (all pages)`)
      return allServices
    }

    // Original single page fetch logic
    const searchParams = new URLSearchParams()

    if (params?.per_page) {
      searchParams.set('per_page', params.per_page.toString())
    }
    if (params?.page) {
      searchParams.set('page', params.page.toString())
    }

    const url = `${WORDPRESS_API_URL}/wp-json/wp/v2/additional-service?${searchParams.toString()}`

    console.log('Fetching WordPress additional services from:', url)

    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (WORDPRESS_API_KEY) {
      requestHeaders['Authorization'] = `Bearer ${WORDPRESS_API_KEY}`
    }

    const response = await fetch(url, {
      headers: requestHeaders,
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`WordPress API error (${response.status}):`, response.statusText, errorText)
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`Successfully fetched ${data.length} additional services from WordPress`)
    return data as WordPressAdditionalService[]
  } catch (error) {
    console.error('Error fetching WordPress additional services:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    return []
  }
}

export async function fetchWordPressAdditionalService(slug: string): Promise<WordPressAdditionalService | null> {
  try {
    if (!WORDPRESS_API_URL) {
      console.error('NEXT_PUBLIC_WORDPRESS_API_URL is not set in environment variables')
      return null
    }

    const url = `${WORDPRESS_API_URL}/wp-json/wp/v2/additional-service?slug=${slug}`

    console.log('Fetching WordPress additional service from:', url)

    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (WORDPRESS_API_KEY) {
      requestHeaders['Authorization'] = `Bearer ${WORDPRESS_API_KEY}`
    }

    const response = await fetch(url, {
      headers: requestHeaders,
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`WordPress API error (${response.status}):`, response.statusText, errorText)
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
    }

    const services = await response.json()
    return services.length > 0 ? (services[0] as WordPressAdditionalService) : null
  } catch (error) {
    console.error('Error fetching WordPress additional service:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    return null
  }
}

export async function fetchWordPressTestimonials(params?: {
  per_page?: number
  page?: number
  fetchAll?: boolean
}): Promise<WordPressTestimonial[]> {
  try {
    if (!WORDPRESS_API_URL) {
      console.error('NEXT_PUBLIC_WORDPRESS_API_URL is not set in environment variables')
      return []
    }

    // If fetchAll is true, fetch all pages
    if (params?.fetchAll) {
      const allTestimonials: WordPressTestimonial[] = []
      let page = 1
      let hasMore = true
      const perPage = params.per_page || 100

      while (hasMore) {
        const searchParams = new URLSearchParams()
        searchParams.set('per_page', perPage.toString())
        searchParams.set('page', page.toString())

        const url = `${WORDPRESS_API_URL}/wp-json/wp/v2/testimonial?${searchParams.toString()}`

        const requestHeaders: HeadersInit = {
          'Content-Type': 'application/json',
        }

        if (WORDPRESS_API_KEY) {
          requestHeaders['Authorization'] = `Bearer ${WORDPRESS_API_KEY}`
        }

        const response = await fetch(url, {
          headers: requestHeaders,
          next: { revalidate: 300 },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`WordPress API error (${response.status}):`, response.statusText, errorText)
          break
        }

        const data = await response.json()
        allTestimonials.push(...(data as WordPressTestimonial[]))

        // Check if there are more pages
        const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10)
        hasMore = page < totalPages && data.length === perPage
        page++

        if (data.length === 0) {
          hasMore = false
        }
      }

      console.log(`Successfully fetched ${allTestimonials.length} testimonials from WordPress (all pages)`)
      return allTestimonials
    }

    // Original single page fetch logic
    const searchParams = new URLSearchParams()

    if (params?.per_page) {
      searchParams.set('per_page', params.per_page.toString())
    }
    if (params?.page) {
      searchParams.set('page', params.page.toString())
    }

    const url = `${WORDPRESS_API_URL}/wp-json/wp/v2/testimonial?${searchParams.toString()}`

    console.log('Fetching WordPress testimonials from:', url)

    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (WORDPRESS_API_KEY) {
      requestHeaders['Authorization'] = `Bearer ${WORDPRESS_API_KEY}`
    }

    const response = await fetch(url, {
      headers: requestHeaders,
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`WordPress API error (${response.status}):`, response.statusText, errorText)
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`Successfully fetched ${data.length} testimonials from WordPress`)
    return data as WordPressTestimonial[]
  } catch (error) {
      console.error('Error fetching WordPress testimonials:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
      }
      return []
    }
  }

export async function fetchWordPressWhyUs(slug?: string): Promise<WordPressWhyUs | null> {
  try {
    if (!WORDPRESS_API_URL) {
      console.error('NEXT_PUBLIC_WORDPRESS_API_URL is not set in environment variables')
      return null
    }

    const targetSlug = slug || 'why-choose'
    const url = `${WORDPRESS_API_URL}/wp-json/wp/v2/why-us?slug=${targetSlug}`

    console.log('Fetching WordPress why-us from:', url)

    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (WORDPRESS_API_KEY) {
      requestHeaders['Authorization'] = `Bearer ${WORDPRESS_API_KEY}`
    }

    const response = await fetch(url, {
      headers: requestHeaders,
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`WordPress API error (${response.status}):`, response.statusText, errorText)
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
    }

    const whyUsData = await response.json()

    if (!whyUsData || whyUsData.length === 0) {
      console.log('No why-us found')
      return null
    }

    const whyUs = whyUsData[0] as WordPressWhyUs
    
    // Normalize ACF fields
    const normalizedWhyUs: WordPressWhyUs = whyUs.acf
      ? {
          ...whyUs,
          acf: {
            ...whyUs.acf,
          },
        }
      : whyUs

    console.log('Parsed Why Us:', {
      id: normalizedWhyUs.id,
      hasACF: !!normalizedWhyUs.acf,
      heading: normalizedWhyUs.acf?.heading,
      itemsCount: normalizedWhyUs.acf?.why_us_?.length,
    })

    return normalizedWhyUs
  } catch (error) {
    console.error('Error fetching WordPress why-us:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    return null
  }
}

export async function fetchWordPressFAQ(slug?: string): Promise<WordPressFAQ | null> {
  try {
    if (!WORDPRESS_API_URL) {
      console.error('NEXT_PUBLIC_WORDPRESS_API_URL is not set in environment variables')
      return null
    }

    const targetSlug = slug || 'faq'
    const url = `${WORDPRESS_API_URL}/wp-json/wp/v2/faq?slug=${targetSlug}`

    console.log('Fetching WordPress FAQ from:', url)

    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (WORDPRESS_API_KEY) {
      requestHeaders['Authorization'] = `Bearer ${WORDPRESS_API_KEY}`
    }

    const response = await fetch(url, {
      headers: requestHeaders,
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`WordPress API error (${response.status}):`, response.statusText, errorText)
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`)
    }

    const faqData = await response.json()

    if (!faqData || faqData.length === 0) {
      console.log('No FAQ found')
      return null
    }

    const faq = faqData[0] as WordPressFAQ

    console.log('Parsed FAQ:', {
      id: faq.id,
      hasACF: !!faq.acf,
      heading: faq.acf?.heading,
      itemsCount: faq.acf?.faq?.length,
    })

    return faq
  } catch (error) {
    console.error('Error fetching WordPress FAQ:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    return null
  }
}

