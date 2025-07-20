import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Linkedin, Instagram, Twitter, Mail, ArrowRight } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-xl font-bold text-secondary">Village of Wisdom</span>
            </Link>
            <p className="mt-2 text-sm text-gray-600">
              Empowering families to recognize and nurture their children's unique brilliance.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:col-span-3">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Navigation</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-sm text-gray-600 hover:text-accent">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="text-sm text-gray-600 hover:text-accent">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/about-olamina" className="text-sm text-gray-600 hover:text-accent">
                    About Olamina
                  </Link>
                </li>
                <li>
                  <Link href="/community-impact" className="text-sm text-gray-600 hover:text-accent">
                    Community Impact
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="text-sm text-gray-600 hover:text-accent">
                    Resources
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms" className="text-sm text-gray-600 hover:text-accent">
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-gray-600 hover:text-accent">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/data-ethics" className="text-sm text-gray-600 hover:text-accent">
                    Data Ethics
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium">Connect</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <Link href="/contact" className="text-sm text-gray-600 hover:text-accent">
                    Contact Us
                  </Link>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Join Our Newsletter</h4>
                  <div className="flex gap-2">
                    <Input type="email" placeholder="Your email" className="h-9 text-sm" />
                    <Button size="sm" className="h-9 bg-primary text-white hover:bg-primary/90">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Link href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Linkedin className="h-4 w-4 text-gray-600" />
                      <span className="sr-only">LinkedIn</span>
                    </Button>
                  </Link>
                  <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Instagram className="h-4 w-4 text-gray-600" />
                      <span className="sr-only">Instagram</span>
                    </Button>
                  </Link>
                  <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Twitter className="h-4 w-4 text-gray-600" />
                      <span className="sr-only">Twitter</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Village of Wisdom. All rights reserved.
          </p>
          <p className="text-xs text-gray-600 mt-2 md:mt-0">Powered by Village of Wisdom</p>
        </div>
      </div>
    </footer>
  )
}
