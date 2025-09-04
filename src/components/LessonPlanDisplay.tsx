import React from 'react';
import { Download } from 'lucide-react';
import { LessonPlan } from '@/services/mongodb';

interface LessonPlanDisplayProps {
  lessonPlan: LessonPlan;
  onDownload: (lessonPlan: LessonPlan) => Promise<void>;
}

export function LessonPlanDisplay({ lessonPlan, onDownload }: LessonPlanDisplayProps) {
  const handleDownload = async () => {
    await onDownload(lessonPlan);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Generated Lesson Plan</h3>
        <button
          onClick={handleDownload}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-900">{lessonPlan.title}</h4>
          <p className="text-sm text-gray-600">
            {lessonPlan.subject} • Grade {lessonPlan.grade} • {lessonPlan.duration}
          </p>
        </div>
        
        {lessonPlan.objectives.length > 0 && (
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Learning Objectives</h5>
            <ul className="list-disc list-inside space-y-1">
              {lessonPlan.objectives.map((objective, index) => (
                <li key={index} className="text-sm text-gray-700">{objective}</li>
              ))}
            </ul>
          </div>
        )}
        
        {lessonPlan.procedures.length > 0 && (
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Activities</h5>
            <ul className="list-disc list-inside space-y-1">
              {lessonPlan.procedures.map((activity, index) => (
                <li key={index} className="text-sm text-gray-700">{activity}</li>
              ))}
            </ul>
          </div>
        )}
        
        {lessonPlan.materials.length > 0 && (
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Materials</h5>
            <ul className="list-disc list-inside space-y-1">
              {lessonPlan.materials.map((material, index) => (
                <li key={index} className="text-sm text-gray-700">{material}</li>
              ))}
            </ul>
          </div>
        )}
        
        {lessonPlan.assessment && (
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Assessment</h5>
            <p className="text-sm text-gray-700">
              {Array.isArray(lessonPlan.assessment) 
                ? lessonPlan.assessment.join(', ')
                : typeof lessonPlan.assessment === 'string'
                ? lessonPlan.assessment
                : 'Assessment details available'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
