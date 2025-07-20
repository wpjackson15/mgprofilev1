"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"

const testimonials = [
  {
    quote:
      "The Genius Profile helped me have a productive conversation with my son's teacher. For the first time, we focused on his strengths instead of just areas for improvement.",
    author: "Tasha M.",
    role: "Parent of 9-year-old",
    useCase: "How I Used My Genius Profile to Talk to My Son's Teacher",
    story:
      "When my son started struggling in math, his teacher only focused on his weaknesses. I brought his Genius Profile to our parent-teacher conference, which highlighted his visual learning style and creative problem-solving abilities. Together, we developed a plan that incorporated these strengths into his math lessons. His grades improved, but more importantly, his confidence soared.",
  },
  {
    quote:
      "As an educator, the Genius Profiles have transformed how I approach each student. I can now see the unique brilliance in every child, especially those who might be overlooked in traditional assessments.",
    author: "Marcus J.",
    role: "5th Grade Teacher",
    useCase: "Reimagining My Classroom Through Strength-Based Approaches",
    story:
      "I used to rely heavily on standardized assessments to understand my students. After incorporating Genius Profiles, I discovered hidden talents in students who were previously struggling. One student who had difficulty with written assignments turned out to be an exceptional oral storyteller. By allowing her to record her stories before writing them down, her literacy skills improved dramatically.",
  },
  {
    quote:
      "The culturally affirming approach of the Genius Profile helped my daughter embrace her heritage as a strength rather than something that made her different from her peers.",
    author: "Keisha W.",
    role: "Mother of 12-year-old",
    useCase: "Building Cultural Pride Through Strength Recognition",
    story:
      "My daughter was one of few Black students in her school and started to downplay her cultural background to fit in. Through the Genius Profile process, she recognized how her bicultural experience gave her unique perspectives and communication skills. She's now leading a cultural awareness club at school and mentoring younger students from similar backgrounds.",
  },
]

export function TestimonialSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [showFullStory, setShowFullStory] = useState(false)

  const nextTestimonial = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
    setShowFullStory(false)
  }

  const prevTestimonial = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
    setShowFullStory(false)
  }

  const toggleStory = () => {
    setShowFullStory(!showFullStory)
  }

  const currentTestimonial = testimonials[activeIndex]

  return (
    <section className="w-full py-12 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-secondary">Real Stories, Real Impact</h2>
          <p className="mt-2 text-gray-600 md:text-lg max-w-[700px]">
            Hear from parents, educators, and students who have experienced the power of strength-based approaches.
          </p>
        </div>

        <Card className="border border-border bg-background/60 backdrop-blur-sm max-w-4xl mx-auto">
          <CardContent className="p-6 md:p-8">
            <div className="flex justify-center mb-6">
              <Quote className="h-12 w-12 text-secondary/20" />
            </div>

            <blockquote className="text-xl md:text-2xl text-center font-medium mb-6">
              {currentTestimonial.quote}
            </blockquote>

            <div className="text-center mb-8">
              <p className="font-semibold">{currentTestimonial.author}</p>
              <p className="text-sm text-gray-600">{currentTestimonial.role}</p>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-medium text-center mb-4">{currentTestimonial.useCase}</h3>

              <div
                className={`overflow-hidden transition-all duration-300 ${showFullStory ? "max-h-[500px]" : "max-h-[80px]"}`}
              >
                <p className="text-gray-600">{currentTestimonial.story}</p>
              </div>

              <div className="flex justify-center mt-4">
                <Button
                  variant="ghost"
                  onClick={toggleStory}
                  className="text-accent hover:text-accent/90 hover:bg-accent/10"
                >
                  {showFullStory ? "Read Less" : "Read Full Story"}
                </Button>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <Button variant="outline" size="icon" onClick={prevTestimonial} className="rounded-full h-10 w-10">
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Previous testimonial</span>
              </Button>

              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`h-2 w-2 rounded-full ${index === activeIndex ? "bg-secondary" : "bg-secondary/20"}`}
                    onClick={() => {
                      setActiveIndex(index)
                      setShowFullStory(false)
                    }}
                  >
                    <span className="sr-only">Testimonial {index + 1}</span>
                  </button>
                ))}
              </div>

              <Button variant="outline" size="icon" onClick={nextTestimonial} className="rounded-full h-10 w-10">
                <ChevronRight className="h-5 w-5" />
                <span className="sr-only">Next testimonial</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
