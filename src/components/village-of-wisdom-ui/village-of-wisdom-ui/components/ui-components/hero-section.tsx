import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-secondary">
              See Your Child's Brilliance Reflected Back
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl">
              A personalized tool that celebrates your child's unique strengths while connecting you with community
              resources and support.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 min-[400px]:gap-6">
            <Link href="/create-profile">
              <Button size="lg" className="bg-primary text-white hover:bg-primary/90">
                Start Your Profile
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline">
                Learn How It Works
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
