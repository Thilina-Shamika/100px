"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CircleArrowRight } from "lucide-react"

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitSuccess(false)

    // TODO: Replace with your actual API endpoint
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      console.log("Contact form submitted:", formData)
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      })
      setErrors({})
      setSubmitSuccess(true)
      
      // Hide success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000)
    } catch (error) {
      console.error("Error submitting contact form:", error)
      setErrors({ submit: "Failed to send message. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative p-6 sm:p-8 lg:p-10 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-white/5 to-white/10 border border-white/20 shadow-lg">
      <h2 className="text-white text-2xl sm:text-3xl font-normal mb-6" style={{ fontSize: '40px', fontWeight: 400, lineHeight: '40px' }}>
        Send us a Message
      </h2>

      {submitSuccess && (
        <div className="mb-6 p-4 rounded-lg bg-[#B5FF00]/20 border border-[#B5FF00]/50 text-[#B5FF00] text-sm">
          Thank you! Your message has been sent successfully.
        </div>
      )}

      {errors.submit && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="name" className="text-white">Name <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#B5FF00] focus:ring-[#B5FF00]"
            placeholder="Your Name"
            required
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="email" className="text-white">Email <span className="text-red-500">*</span></Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#B5FF00] focus:ring-[#B5FF00]"
            placeholder="your@example.com"
            required
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <Label htmlFor="phone" className="text-white">Phone (Optional)</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#B5FF00] focus:ring-[#B5FF00]"
            placeholder="+94 77 123 4567"
          />
        </div>

        <div>
          <Label htmlFor="subject" className="text-white">Subject (Optional)</Label>
          <Input
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#B5FF00] focus:ring-[#B5FF00]"
            placeholder="Subject"
          />
        </div>

        <div>
          <Label htmlFor="message" className="text-white">Message <span className="text-red-500">*</span></Label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={6}
            className="mt-1 w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#B5FF00] focus:border-[#B5FF00] resize-none"
            placeholder="Your message..."
            required
          />
          {errors.message && <p className="text-red-400 text-xs mt-1">{errors.message}</p>}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full bg-[#B5FF00] hover:bg-[#9FE000] text-black font-semibold shadow-lg hover:shadow-[#B5FF00]/50 group"
        >
          {isSubmitting ? (
            "Sending..."
          ) : (
            <div className="flex items-center gap-2">
              <CircleArrowRight className="group-hover:translate-x-1 transition-transform" />
              <span className="uppercase font-medium">Send Message</span>
            </div>
          )}
        </Button>
      </form>
    </div>
  )
}

