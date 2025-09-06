"use client";
import ChatbotWizard from "./ChatbotWizard";
import ProfilePreview from "../profile-preview/ProfilePreview";
import AuthButton from "@/components/AuthButton";
import * as React from 'react';
import Link from 'next/link';
import { ModuleSummariesProvider, useModuleSummaries } from "@/hooks/ModuleSummariesContext";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { MessageCircle, User as UserIcon, RotateCcw } from "lucide-react";
import { useResourceMatches, type Resource } from "@/hooks/useResourceMatches";
import ResourcePreferencesForm from "@/components/ResourcePreferencesForm";

interface ChatbotContentProps {
  answers: Record<string, string[]>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  accepted: boolean;
  checked: boolean;
  user: User | null;
  clearChatSignal: number;
  showConfirm: boolean;
  chatbotRef: React.RefObject<{ clearChat: () => void } | null>;
  resources: Resource[];
  resourcesLoading: boolean;
  resourcesError: string | null;
  isScraping: boolean;
  isProfileComplete: boolean;
  showResourceForm: boolean;
  resourcePreferences: { grade: string; location: string } | null;
  onShowResourceForm: () => void;
  onResourcePreferencesSubmit: (preferences: { grade: string; location: string }) => void;
  onResourcePreferencesSkip: () => void;
  onStart: () => void;
  onClearChat: () => void;
  onQuickClear: () => void;
  onConfirmClear: () => void;
  onSetChecked: (checked: boolean) => void;
  onSetShowConfirm: (show: boolean) => void;
}

function ChatbotContent({
  answers,
  setAnswers,
  accepted,
  checked,
  user,
  clearChatSignal,
  showConfirm,
  chatbotRef,
  resources,
  resourcesLoading,
  resourcesError,
  isScraping,
  isProfileComplete,
  showResourceForm,
  resourcePreferences,
  onShowResourceForm,
  onResourcePreferencesSubmit,
  onResourcePreferencesSkip,
  onStart,
  onClearChat,
  onQuickClear,
  onConfirmClear,
  onSetChecked,
  onSetShowConfirm
}: ChatbotContentProps) {
  const { resetSummaries } = useModuleSummaries();

  const handleQuickClear = () => {
    // Immediate clear without confirmation
    resetSummaries(); // Clear summaries immediately
    onQuickClear();
  };

  const handleConfirmClear = () => {
    // Immediate state reset for better UX
    resetSummaries(); // Clear summaries immediately
    onConfirmClear();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Genius Profile</h1>
          <p className="text-gray-600">Discover your unique learning profile through guided conversations</p>
        </div>

        {/* Navigation and Auth */}
        <div className="flex justify-between items-center">
          <Link href="/" 
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <AuthButton />
        </div>

        {!accepted ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md mx-auto">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Welcome to My Genius Profile</h2>
              <p className="text-gray-600 mb-6">
                Start your journey to discover your unique learning profile and unlock your potential.
              </p>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => onSetChecked(e.target.checked)}
                    className="accent-blue-600 w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the <span className="underline cursor-not-allowed text-gray-500">Terms and Conditions (coming soon)</span>
                  </span>
                </label>
                
                <button
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  disabled={!checked}
                  onClick={onStart}
                >
                  Start My Profile Journey
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Chatbot Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Profile Conversation</h2>
                </div>
                <ChatbotWizard
                  ref={chatbotRef}
                  setAnswers={setAnswers}
                  user={user}
                  clearChatSignal={clearChatSignal}
                  onModuleComplete={(module, answers) => {
                    // This will trigger summary generation in the ProfilePreview
                    console.log(`Module ${module} completed with ${answers.length} answers`);
                  }}
                />
                
                {/* Clear Chat Button - Under the chat window */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  {showConfirm ? (
                    <div className="space-y-3">
                      <span className="text-sm text-gray-700 text-center block">Are you sure you want to clear all progress?</span>
                      <div className="flex gap-3">
                        <button 
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm" 
                          onClick={handleConfirmClear}
                        >
                          Yes, clear all
                        </button>
                        <button 
                          className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium text-sm" 
                          onClick={() => onSetShowConfirm(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                        onClick={onClearChat}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Clear Chat
                      </button>
                      <button
                        className="px-4 py-2 bg-blue-200 text-blue-800 rounded-lg hover:bg-blue-300 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                        onClick={handleQuickClear}
                        title="Quick reset without confirmation"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Quick Reset
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Preview Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <UserIcon className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Your Genius Profile</h2>
                </div>
                <ProfilePreview
                  answers={answers}
                  onClearChat={() => {}} // This will be handled by the parent
                />
              </div>
            </div>

            {/* Recommended Resources Section - Only show after profile completion */}
            {isProfileComplete && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {!resourcePreferences && !showResourceForm ? (
                  // Show initial completion message with button to get resources
                  <div className="text-center py-8">
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center text-sm font-medium">
                      🎉 Profile Complete! Ready to find resources for your child?
                    </div>
                    <h3 className="text-lg font-semibold mb-4 text-green-700">Get Personalized Resource Recommendations</h3>
                    <p className="text-gray-600 text-sm mb-6">
                      Tell us your child's grade and location to see the most relevant local resources.
                    </p>
                    <button
                      onClick={onShowResourceForm}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Find My Resources
                    </button>
                  </div>
                ) : showResourceForm ? (
                  // Show the preferences form
                  <ResourcePreferencesForm
                    onSubmit={onResourcePreferencesSubmit}
                    onSkip={onResourcePreferencesSkip}
                  />
                ) : (
                  // Show filtered resources
                  <>
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center text-sm font-medium">
                      🎯 Resources for Grade {resourcePreferences?.grade} in {resourcePreferences?.location}
                    </div>
                    <h3 className="text-lg font-semibold mb-4 text-green-700">Recommended Local Resources</h3>
                    {resourcesLoading ? (
                      <div className="text-gray-500 text-sm text-center py-8">
                        {isScraping ? (
                          <div>
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p>🔍 Scraping local resources for {resourcePreferences?.location}...</p>
                            <p className="text-xs text-gray-400 mt-1">This may take 30-60 seconds</p>
                          </div>
                        ) : (
                          "Loading resources..."
                        )}
                      </div>
                    ) : resourcesError ? (
                      <div className="text-red-500 text-sm text-center py-8">{resourcesError}</div>
                    ) : resources.length === 0 ? (
                      <div className="text-gray-500 text-sm text-center py-8">
                        No resources found for your criteria. Try adjusting your location or grade.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {resources.slice(0, 6).map((res) => (
                            <div key={res.url} className="border border-gray-200 rounded-lg p-4 bg-green-50 hover:bg-green-100 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-green-900 text-sm">{res.name}</span>
                                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">{res.category}</span>
                              </div>
                              <div className="text-gray-700 text-xs mb-2 line-clamp-2">{res.description}</div>
                              <div className="text-xs text-gray-500 mb-2">
                                {res.city && res.state ? `${res.city}, ${res.state}` : ""}
                              </div>
                              <Link
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-green-700 underline text-xs hover:text-green-800"
                              >
                                Visit Website
                              </Link>
                            </div>
                          ))}
                        </div>
                        {resources.length > 6 && (
                          <div className="mt-4 text-center">
                            <button className="text-green-600 hover:text-green-800 text-sm font-medium underline">
                              View All {resources.length} Resources
                            </button>
                          </div>
                        )}
                        <div className="mt-4 text-center">
                          <button
                            onClick={onShowResourceForm}
                            className="text-gray-600 hover:text-gray-800 text-sm underline"
                          >
                            Change preferences
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function ChatbotPage() {
  const [answers, setAnswers] = React.useState<Record<string, string[]>>({});
  const [accepted, setAccepted] = React.useState(false);
  const [checked, setChecked] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [clearChatSignal, setClearChatSignal] = React.useState(0);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [resourcePreferences, setResourcePreferences] = React.useState<{ grade: string; location: string } | null>(null);
  const [showResourceForm, setShowResourceForm] = React.useState(false);
  const chatbotRef = React.useRef<{ clearChat: () => void } | null>(null);
  const { resources, loading: resourcesLoading, error: resourcesError, isScraping, fetchResourcesForCity } = useResourceMatches();

  // Filter resources based on preferences
  const filteredResources = React.useMemo(() => {
    if (!resources || !resourcePreferences) return resources || [];
    
    return resources.filter((resource) => {
      // Filter by grade/age
      if (resourcePreferences.grade) {
        const gradeNum = parseInt(resourcePreferences.grade);
        const resourceAgeMin = resource.age_min || 5;
        const resourceAgeMax = resource.age_max || 14;
        
        // Check if the grade falls within the resource's age range
        // Rough conversion: K=5, 1st=6, 2nd=7, etc.
        const childAge = gradeNum === 0 ? 5 : gradeNum + 5; // K=5, 1st=6, etc.
        
        if (childAge < resourceAgeMin || childAge > resourceAgeMax) {
          return false;
        }
      }
      
      // Filter by location (simple string matching)
      if (resourcePreferences.location && resource.city && resource.state) {
        const locationLower = resourcePreferences.location.toLowerCase();
        const cityLower = resource.city.toLowerCase();
        const stateLower = resource.state.toLowerCase();
        
        // Check if location contains city or state
        if (!locationLower.includes(cityLower) && !locationLower.includes(stateLower)) {
          return false;
        }
      }
      
      return true;
    });
  }, [resources, resourcePreferences]);

  React.useEffect(() => {
    // Check localStorage for prior acceptance
    try {
      const val = localStorage.getItem("mgp_terms_accepted");
      if (val === "true") setAccepted(true);
    } catch {}
  }, []);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const handleStart = () => {
    setAccepted(true);
    try {
      localStorage.setItem("mgp_terms_accepted", "true");
    } catch {}
  };

  const handleClearChat = () => {
    setShowConfirm(true);
  };

  const handleQuickClear = () => {
    // Immediate clear without confirmation
    setAnswers({});
    setClearChatSignal((sig) => sig + 1);
  };

  const confirmClearChat = () => {
    // Immediate state reset for better UX
    setAnswers({});
    setShowConfirm(false);
    setResourcePreferences(null);
    setShowResourceForm(false);
    // Trigger clear with minimal delay
    setTimeout(() => setClearChatSignal((sig) => sig + 1), 0);
  };

  const handleResourcePreferencesSubmit = async (preferences: { grade: string; location: string }) => {
    setResourcePreferences(preferences);
    setShowResourceForm(false);
    
    // Extract city and state from location (assuming format like "Atlanta, GA")
    const [city, state] = preferences.location.split(',').map(s => s.trim());
    
    if (city && state) {
      // Fetch resources for this specific city
      await fetchResourcesForCity(city, state);
    }
  };

  const handleResourcePreferencesSkip = () => {
    setShowResourceForm(false);
  };

  // Check if profile is complete (has answers)
  const isProfileComplete = Object.keys(answers).length > 0;

  return (
    <ModuleSummariesProvider>
      <ChatbotContent 
        answers={answers}
        setAnswers={setAnswers}
        accepted={accepted}
        checked={checked}
        user={user}
        clearChatSignal={clearChatSignal}
        showConfirm={showConfirm}
        chatbotRef={chatbotRef}
        resources={filteredResources}
        resourcesLoading={resourcesLoading}
        resourcesError={resourcesError}
        isScraping={isScraping}
        isProfileComplete={isProfileComplete}
        showResourceForm={showResourceForm}
        resourcePreferences={resourcePreferences}
        onShowResourceForm={() => setShowResourceForm(true)}
        onResourcePreferencesSubmit={handleResourcePreferencesSubmit}
        onResourcePreferencesSkip={handleResourcePreferencesSkip}
        onStart={handleStart}
        onClearChat={handleClearChat}
        onQuickClear={handleQuickClear}
        onConfirmClear={confirmClearChat}
        onSetChecked={setChecked}
        onSetShowConfirm={setShowConfirm}
      />
    </ModuleSummariesProvider>
  );
} 