"use client";
import React, { useState, useRef } from "react";
import { Upload, Plus, Users, BookOpen, X, User, Trash2, Download, FileText, File, ExternalLink } from "lucide-react";


interface StudentProfile {
  id: string;
  name: string;
  grade: string;
  subject: string;
  profile: string;
  createdAt: string;
}

interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  grade: string;
  objectives: string[];
  activities: string[];
  assessment: string;
  materials: string[];
  duration: string;
  createdAt: string;
  outputFormat?: 'pdf' | 'google-doc';
  googleDocUrl?: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (profiles: StudentProfile[]) => void;
}

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (profile: StudentProfile) => void;
}

function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const profiles: StudentProfile[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (file.type === 'application/pdf') {
          // Handle PDF files with direct LLM parsing
          try {
            // Convert PDF to base64
            const arrayBuffer = await file.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            
            // Use LLM to parse student profiles directly from PDF
            const response = await fetch('/.netlify/functions/parse-pdf-profiles', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pdfBase64: base64 })
            });

            if (!response.ok) {
              throw new Error('Failed to parse PDF with AI');
            }

            const data = await response.json();
            const extractedProfiles = data.profiles || [];
            
            extractedProfiles.forEach((profile: any, index: number) => {
              profiles.push({
                id: `upload-${Date.now()}-${i}-${index}`,
                name: profile.name || 'Unknown Student',
                grade: profile.grade || 'Unknown Grade',
                subject: profile.subject || 'Unknown Subject',
                profile: profile.profile || 'No profile provided',
                createdAt: new Date().toISOString()
              });
            });
          } catch (pdfError) {
            console.error('PDF processing error:', pdfError);
            setError('Failed to process PDF file. The AI will analyze the content and extract student profiles automatically.');
            setIsUploading(false);
            return;
          }
        } else {
          // Handle CSV/TXT files
          const text = await file.text();
          
          // Simple CSV parsing (you can enhance this)
          const lines = text.split('\n').filter(line => line.trim());
          
          for (let j = 1; j < lines.length; j++) {
            const values = lines[j].split(',').map(v => v.trim());
            if (values.length >= 4) {
              profiles.push({
                id: `upload-${Date.now()}-${j}`,
                name: values[0] || 'Unknown',
                grade: values[1] || 'Unknown',
                subject: values[2] || 'Unknown',
                profile: values[3] || 'No profile provided',
                createdAt: new Date().toISOString()
              });
            }
          }
        }
      }

      if (profiles.length > 0) {
        onUpload(profiles);
        onClose();
      } else {
        setError('No valid profiles found in uploaded files');
      }
    } catch {
      setError('Error processing files. Please check the format.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Upload Student Profiles</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload CSV files with columns: Name, Grade, Subject, Profile. PDF files are automatically analyzed by AI to extract student profiles!
          </p>
          <div className="text-center">
            <a
              href="/sample-student-profiles.csv"
              download
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Download sample CSV file
            </a>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".csv,.txt,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              {isUploading ? 'AI is analyzing your files...' : 'Click to select files or drag and drop'}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isUploading ? 'Analyzing...' : 'Select Files'}
            </button>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ManualEntryModal({ isOpen, onClose, onAdd }: ManualEntryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    subject: '',
    profile: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.grade || !formData.subject || !formData.profile) {
      return;
    }

    const newProfile: StudentProfile = {
      id: `manual-${Date.now()}`,
      ...formData,
      createdAt: new Date().toISOString()
    };

    onAdd(newProfile);
    setFormData({ name: '', grade: '', subject: '', profile: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Student Profile</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade Level *
            </label>
            <select
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Grade</option>
              <option value="K">Kindergarten</option>
              <option value="1">1st Grade</option>
              <option value="2">2nd Grade</option>
              <option value="3">3rd Grade</option>
              <option value="4">4th Grade</option>
              <option value="5">5th Grade</option>
              <option value="6">6th Grade</option>
              <option value="7">7th Grade</option>
              <option value="8">8th Grade</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Math, Science, ELA"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student Profile *
            </label>
            <textarea
              value={formData.profile}
              onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the student's learning style, strengths, challenges, cultural background, interests..."
              required
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Add Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LessonPlansPage() {
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([]);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'google-doc'>('pdf');
  
  // Lesson plan settings
  const [lessonSettings, setLessonSettings] = useState({
    grade: '',
    subject: '',
    state: ''
  });

  const handleUploadFiles = () => {
    setIsUploadModalOpen(true);
  };

  const handleManualEntry = () => {
    setIsManualModalOpen(true);
  };

  const handleAddProfile = (profile: StudentProfile) => {
    setStudentProfiles(prev => [...prev, profile]);
  };

  const handleUploadProfiles = (profiles: StudentProfile[]) => {
    setStudentProfiles(prev => [...prev, ...profiles]);
  };

  const handleRemoveProfile = (id: string) => {
    setStudentProfiles(prev => prev.filter(p => p.id !== id));
  };

  const handleGenerateLessonPlan = async () => {
    if (studentProfiles.length === 0) {
      setGenerationError('Please add at least one student profile.');
      return;
    }
    
    if (!lessonSettings.grade || !lessonSettings.subject || !lessonSettings.state) {
      setGenerationError('Please select grade level, subject, and state before generating a lesson plan.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Create a prompt for the AI based on student profiles and lesson settings
      const profilesText = studentProfiles.map(p => 
        `Student: ${p.name} (Grade ${p.grade}, ${p.subject})\nProfile: ${p.profile}`
      ).join('\n\n');

      const prompt = `Create a culturally responsive, differentiated lesson plan that aligns with ${lessonSettings.state} state standards for ${lessonSettings.grade} grade ${lessonSettings.subject}.

Lesson Settings:
- Grade Level: ${lessonSettings.grade}
- Subject: ${lessonSettings.subject}
- State: ${lessonSettings.state}

Student Profiles:
${profilesText}

Please provide a comprehensive, standards-aligned lesson plan with:
1. Title and subject
2. Grade level
3. Learning objectives that align with ${lessonSettings.state} state standards for ${lessonSettings.grade} grade ${lessonSettings.subject}
4. Engaging activities that accommodate different learning styles and cultural backgrounds
5. Assessment methods that measure standards mastery
6. Required materials
7. Estimated duration

Format the response as JSON with the following structure:
{
  "title": "Lesson Title",
  "subject": "Subject",
  "grade": "Grade Level",
  "objectives": ["Objective 1", "Objective 2"],
  "activities": ["Activity 1", "Activity 2"],
  "assessment": "Assessment description",
  "materials": ["Material 1", "Material 2"],
  "duration": "45 minutes"
}`;

      // Call the lesson plan generation service
      const response = await fetch('/.netlify/functions/generate-lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          studentProfiles, 
          outputFormat,
          lessonSettings 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate lesson plan');
      }

      const data = await response.json();
      
      const newLessonPlan: LessonPlan = {
        id: `lesson-${Date.now()}`,
        ...data,
        outputFormat,
        createdAt: new Date().toISOString()
      };

      setLessonPlan(newLessonPlan);
    } catch (error) {
      setGenerationError('Failed to generate lesson plan. Please try again.');
      console.error('Lesson plan generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadLessonPlan = async () => {
    if (!lessonPlan) return;
    
    if (lessonPlan.outputFormat === 'google-doc' && lessonPlan.googleDocUrl) {
      // Open Google Doc in new tab
      window.open(lessonPlan.googleDocUrl, '_blank');
      return;
    }
    
    // Dynamically import PDF generator to avoid SSR issues
    try {
      const { downloadLessonPlanPDF } = await import('@/lib/pdfGenerator');
      
      const lessonPlanData = {
        title: lessonPlan.title,
        subject: lessonPlan.subject,
        grade: lessonPlan.grade,
        objectives: lessonPlan.objectives,
        activities: lessonPlan.activities,
        assessment: lessonPlan.assessment,
        materials: lessonPlan.materials,
        duration: lessonPlan.duration,
        studentProfiles: studentProfiles
      };

      downloadLessonPlanPDF(lessonPlanData, `lesson-plan-${lessonPlan.title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Genius Lesson Plans</h1>
          <p className="text-gray-600">Create culturally responsive, differentiated lessons based on student profiles</p>
        </div>

        {/* Lesson Settings Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Lesson Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Level *
              </label>
              <select
                value={lessonSettings.grade}
                onChange={(e) => setLessonSettings({ ...lessonSettings, grade: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Grade</option>
                <option value="K">Kindergarten</option>
                <option value="1">1st Grade</option>
                <option value="2">2nd Grade</option>
                <option value="3">3rd Grade</option>
                <option value="4">4th Grade</option>
                <option value="5">5th Grade</option>
                <option value="6">6th Grade</option>
                <option value="7">7th Grade</option>
                <option value="8">8th Grade</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <select
                value={lessonSettings.subject}
                onChange={(e) => setLessonSettings({ ...lessonSettings, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Subject</option>
                <option value="Math">Mathematics</option>
                <option value="Science">Science</option>
                <option value="ELA">English Language Arts</option>
                <option value="Social Studies">Social Studies</option>
                <option value="History">History</option>
                <option value="Geography">Geography</option>
                <option value="Art">Art</option>
                <option value="Music">Music</option>
                <option value="Physical Education">Physical Education</option>
                <option value="Technology">Technology</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <select
                value={lessonSettings.state}
                onChange={(e) => setLessonSettings({ ...lessonSettings, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select State</option>
                <option value="AL">Alabama</option>
                <option value="AK">Alaska</option>
                <option value="AZ">Arizona</option>
                <option value="AR">Arkansas</option>
                <option value="CA">California</option>
                <option value="CO">Colorado</option>
                <option value="CT">Connecticut</option>
                <option value="DE">Delaware</option>
                <option value="FL">Florida</option>
                <option value="GA">Georgia</option>
                <option value="HI">Hawaii</option>
                <option value="ID">Idaho</option>
                <option value="IL">Illinois</option>
                <option value="IN">Indiana</option>
                <option value="IA">Iowa</option>
                <option value="KS">Kansas</option>
                <option value="KY">Kentucky</option>
                <option value="LA">Louisiana</option>
                <option value="ME">Maine</option>
                <option value="MD">Maryland</option>
                <option value="MA">Massachusetts</option>
                <option value="MI">Michigan</option>
                <option value="MN">Minnesota</option>
                <option value="MS">Mississippi</option>
                <option value="MO">Missouri</option>
                <option value="MT">Montana</option>
                <option value="NE">Nebraska</option>
                <option value="NV">Nevada</option>
                <option value="NH">New Hampshire</option>
                <option value="NJ">New Jersey</option>
                <option value="NM">New Mexico</option>
                <option value="NY">New York</option>
                <option value="NC">North Carolina</option>
                <option value="ND">North Dakota</option>
                <option value="OH">Ohio</option>
                <option value="OK">Oklahoma</option>
                <option value="OR">Oregon</option>
                <option value="PA">Pennsylvania</option>
                <option value="RI">Rhode Island</option>
                <option value="SC">South Carolina</option>
                <option value="SD">South Dakota</option>
                <option value="TN">Tennessee</option>
                <option value="TX">Texas</option>
                <option value="UT">Utah</option>
                <option value="VT">Vermont</option>
                <option value="VA">Virginia</option>
                <option value="WA">Washington</option>
                <option value="WV">West Virginia</option>
                <option value="WI">Wisconsin</option>
                <option value="WY">Wyoming</option>
              </select>
            </div>
          </div>
        </div>

        {/* Student Profiles Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Student Profiles ({studentProfiles.length})</h2>
            <div className="flex gap-3">
              <button
                onClick={handleUploadFiles}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Files
              </button>
              <button
                onClick={handleManualEntry}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Manual Entry
              </button>
            </div>
          </div>

          {/* Empty State */}
          {studentProfiles.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No student profiles added yet.</p>
              <p className="text-gray-400">Add profiles to generate personalized lesson plans.</p>
            </div>
          )}

          {/* Student Profiles List */}
          {studentProfiles.length > 0 && (
            <div className="space-y-4">
              {studentProfiles.map((profile) => (
                <div key={profile.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-800">{profile.name}</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                          Grade {profile.grade}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded">
                          {profile.subject}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{profile.profile}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveProfile(profile.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generated Lesson Plan Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Generated Lesson Plan</h2>
            <div className="flex gap-3">
              {lessonPlan && (
                <button
                  onClick={handleDownloadLessonPlan}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {lessonPlan.outputFormat === 'google-doc' ? (
                    <ExternalLink className="w-4 h-4" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {lessonPlan.outputFormat === 'google-doc' ? 'Open Doc' : 'Download'}
                </button>
              )}
              {studentProfiles.length > 0 && (
                <button
                  onClick={handleGenerateLessonPlan}
                  disabled={isGenerating || !lessonSettings.grade || !lessonSettings.subject || !lessonSettings.state}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Generate Lesson Plan'}
                </button>
              )}
            </div>
          </div>

          {/* Output Format Selection */}
          {studentProfiles.length > 0 && !lessonPlan && !isGenerating && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-3">Output Format</h4>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="outputFormat"
                    value="pdf"
                    checked={outputFormat === 'pdf'}
                    onChange={(e) => setOutputFormat(e.target.value as 'pdf' | 'google-doc')}
                    className="text-blue-600"
                  />
                  <File className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-900">PDF Document</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="outputFormat"
                    value="google-doc"
                    checked={outputFormat === 'google-doc'}
                    onChange={(e) => setOutputFormat(e.target.value as 'pdf' | 'google-doc')}
                    className="text-blue-600"
                  />
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-blue-900">Google Doc</span>
                </label>
              </div>
            </div>
          )}

          {/* Error State */}
          {generationError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{generationError}</p>
            </div>
          )}

          {/* Empty State */}
          {!lessonPlan && !isGenerating && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Ready to Generate</p>
              <p className="text-gray-400">
                {studentProfiles.length === 0 
                  ? "Add student profiles and click 'Generate Lesson Plan' to create culturally responsive, differentiated lessons as PDFs or Google Docs."
                  : "Click 'Generate Lesson Plan' to create culturally responsive, differentiated lessons as PDFs or Google Docs."
                }
              </p>
            </div>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Generating your personalized lesson plan...</p>
            </div>
          )}

          {/* Lesson Plan Display */}
          {lessonPlan && !isGenerating && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{lessonPlan.title}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>Subject: {lessonPlan.subject}</span>
                  <span>Grade: {lessonPlan.grade}</span>
                  <span>State: {lessonSettings.state}</span>
                  <span>Duration: {lessonPlan.duration}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Learning Objectives</h4>
                <ul className="space-y-2">
                  {lessonPlan.objectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span className="text-gray-700">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Activities</h4>
                <ul className="space-y-2">
                  {lessonPlan.activities.map((activity, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span className="text-gray-700">{activity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Assessment</h4>
                <p className="text-gray-700">{lessonPlan.assessment}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Materials Needed</h4>
                <ul className="space-y-1">
                  {lessonPlan.materials.map((material, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-purple-600">•</span>
                      <span className="text-gray-700">{material}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadProfiles}
      />
      
      <ManualEntryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAdd={handleAddProfile}
      />
    </main>
  );
} 