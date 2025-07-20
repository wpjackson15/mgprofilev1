import { NavigationBar } from "@/components/ui-components/navigation-bar"
import { HeroSection } from "@/components/ui-components/hero-section"
import { SplitScreenProfileCreator } from "@/components/ui-components/split-screen-profile-creator"
import { FeatureHighlightsGrid } from "@/components/ui-components/feature-highlights-grid"
import { TestimonialSection } from "@/components/ui-components/testimonial-section"
import { OlaminaSpotlight } from "@/components/ui-components/olamina-spotlight"
import { Footer } from "@/components/ui-components/footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <NavigationBar />
      <main className="flex-1">
        <HeroSection />
        <SplitScreenProfileCreator />
        <FeatureHighlightsGrid />
        <TestimonialSection />
        <OlaminaSpotlight />
      </main>
      <Footer />
    </div>
  )
}
