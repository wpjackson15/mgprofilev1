"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, User, Heart, Lightbulb, Sparkles } from "lucide-react"

export function SplitScreenProfileCreator() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm Olamina, your guide to creating a strength-based profile for your child. What's your child's name?",
    },
  ])
  const [input, setInput] = useState("")
  const [activeTab, setActiveTab] = useState("strengths")

  // Mock profile data that would be built from the conversation
  const profileData = {
    strengths: ["Creative problem solver", "Natural leader in group settings", "Persistent when facing challenges"],
    interests: ["Science experiments", "Drawing and visual arts", "Team sports, especially basketball"],
    identity: ["Proud of cultural heritage", "Values family traditions", "Developing strong sense of self"],
    support: [
      "Benefits from hands-on learning approaches",
      "Thrives with regular positive feedback",
      "Needs time to process before responding to questions",
    ],
  }

  const handleSend = () => {
    if (input.trim()) {
      setMessages([
        ...messages,
        { role: "user", content: input },
        {
          role: "assistant",
          content: "Thank you for sharing that. What are some activities your child enjoys doing in their free time?",
        },
      ])
      setInput("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <section className="w-full py-12 md:py-24">
      <div className="container px-4 md:px-6">
        <h2 className="text-2xl font-bold text-center mb-8 text-secondary">Create Your Child's Genius Profile</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Pane: Chat Interface */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle>Chat with Olamina</CardTitle>
              <CardDescription>Our guide will help you reflect on your child's unique strengths</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-end gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 min-h-[80px]"
                />
                <Button onClick={handleSend} size="icon" className="bg-primary hover:bg-primary/90 h-10 w-10">
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send message</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right Pane: Live Profile Build */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle>Profile Preview</CardTitle>
              <CardDescription>Watch your child's profile build in real-time</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <Tabs
                defaultValue="strengths"
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col"
              >
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="strengths">Strengths</TabsTrigger>
                  <TabsTrigger value="interests">Interests</TabsTrigger>
                  <TabsTrigger value="identity">Identity</TabsTrigger>
                  <TabsTrigger value="support">Support</TabsTrigger>
                </TabsList>

                <TabsContent value="strengths" className="flex-1 mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-secondary" />
                      <h3 className="font-medium">Key Strengths</h3>
                    </div>
                    <ul className="space-y-2">
                      {profileData.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="h-6 w-6 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mt-0.5">
                            {index + 1}
                          </div>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="interests" className="flex-1 mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-secondary" />
                      <h3 className="font-medium">Interests & Passions</h3>
                    </div>
                    <ul className="space-y-2">
                      {profileData.interests.map((interest, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="h-6 w-6 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mt-0.5">
                            {index + 1}
                          </div>
                          <span>{interest}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="identity" className="flex-1 mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-secondary" />
                      <h3 className="font-medium">Identity Elements</h3>
                    </div>
                    <ul className="space-y-2">
                      {profileData.identity.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="h-6 w-6 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mt-0.5">
                            {index + 1}
                          </div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="support" className="flex-1 mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-secondary" />
                      <h3 className="font-medium">Support Ideas</h3>
                    </div>
                    <ul className="space-y-2">
                      {profileData.support.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="h-6 w-6 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mt-0.5">
                            {index + 1}
                          </div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
