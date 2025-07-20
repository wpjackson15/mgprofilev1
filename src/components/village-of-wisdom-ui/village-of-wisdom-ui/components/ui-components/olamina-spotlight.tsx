import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, Users, Heart } from "lucide-react"

export function OlaminaSpotlight() {
  return (
    <section className="w-full py-12 md:py-24 bg-secondary/5">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-secondary mb-4">
                Meet Olamina, Your Guide
              </h2>
              <p className="text-gray-600 md:text-lg">
                Olamina is more than just an AI assistant. She's a reflection of our community's collective wisdom,
                designed to provide culturally affirming guidance that celebrates your child's unique brilliance.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-medium">Culturally Affirming Voice</h3>
                  <p className="text-sm text-gray-600">
                    Olamina's guidance is shaped by diverse perspectives and experiences, ensuring every child's
                    cultural background is recognized as a strength.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-medium">Community-Informed Wisdom</h3>
                  <p className="text-sm text-gray-600">
                    Olamina learns from real families through our triad interviews, continuously evolving to better
                    serve our community.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                  <Heart className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-medium">Strength-Based Approach</h3>
                  <p className="text-sm text-gray-600">
                    Every conversation with Olamina focuses on identifying and nurturing your child's unique gifts and
                    talents.
                  </p>
                </div>
              </div>
            </div>

            <Link href="/contribute">
              <Button className="bg-primary text-white hover:bg-primary/90">Contribute to Olamina's Voice</Button>
            </Link>
          </div>

          <div className="flex justify-center">
            <Card className="w-full max-w-md border border-border overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src="/placeholder.svg?height=400&width=600"
                    alt="Families participating in triad interviews"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6 space-y-4">
                  <blockquote className="italic text-gray-600">
                    "Olamina helped me see my son's leadership qualities as a strength rather than 'being bossy.' Now
                    we're channeling that energy in positive ways."
                  </blockquote>
                  <p className="text-sm font-medium">— Parent from triad interview</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
