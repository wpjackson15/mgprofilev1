import { Brain, Users, BookOpen, Palette, MessageCircle, Map, FileText, BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    title: "Strength-Based Insights",
    description: "Discover your child's unique abilities and talents through guided reflection.",
    icon: Brain,
  },
  {
    title: "Peer Network Suggestions",
    description: "Connect with families who share similar interests and strengths.",
    icon: Users,
  },
  {
    title: "Parent Growth Paths",
    description: "Access resources to support your own learning journey as a parent.",
    icon: BookOpen,
  },
  {
    title: "Culturally Affirming Activities",
    description: "Find activities that celebrate and reinforce your child's cultural identity.",
    icon: Palette,
  },
  {
    title: "Tri-Development Conversations",
    description: "Structured dialogues between parents, educators, and children.",
    icon: MessageCircle,
  },
  {
    title: "Local Resource Mapping",
    description: "Discover community resources tailored to your child's specific needs.",
    icon: Map,
  },
  {
    title: "Printable & Shareable Reports",
    description: "Create professional reports to share with teachers and caregivers.",
    icon: FileText,
  },
  {
    title: "Feedback Loop Monitoring",
    description: "Track progress and adjust support strategies over time.",
    icon: BarChart3,
  },
]

export function FeatureHighlightsGrid() {
  return (
    <section className="w-full py-12 md:py-24 bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-secondary">
              Features That Empower
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl">
              Tools designed to help you recognize, nurture, and advocate for your child's unique brilliance.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {features.map((feature, index) => {
            // Determine icon color based on feature type
            let iconColorClass = "text-secondary"
            let bgColorClass = "bg-secondary/10"

            if (feature.icon === Users || feature.icon === MessageCircle) {
              iconColorClass = "text-accent"
              bgColorClass = "bg-accent/10"
            } else if (feature.icon === Palette || feature.icon === Map) {
              iconColorClass = "text-success"
              bgColorClass = "bg-success/10"
            } else if (feature.icon === FileText || feature.icon === BarChart3) {
              iconColorClass = "text-warning"
              bgColorClass = "bg-warning/10"
            }

            return (
              <Card
                key={index}
                className="border border-border bg-background/60 backdrop-blur-sm hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <div className={`w-12 h-12 rounded-full ${bgColorClass} flex items-center justify-center mb-4`}>
                    <feature.icon className={`h-6 w-6 ${iconColorClass}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-gray-600">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
