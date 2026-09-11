import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useStore } from '../store';

const steps = [
  {
    title: 'Welcome to FocusFlow',
    description: 'A complete Pomodoro productivity application to help you focus, track your work, and build better habits.',
    icon: '🍅',
  },
  {
    title: 'The Pomodoro Technique',
    description: 'Work in focused 25-minute sessions called "Pomodoros", separated by short breaks. After 4 Pomodoros, take a longer break. This rhythm helps maintain focus and prevent burnout.',
    icon: '⏱️',
  },
  {
    title: 'Track Your Tasks',
    description: 'Create tasks, assign them to projects, estimate how many Pomodoros they\'ll take, and track your progress. Select a task before starting a timer to associate your focus time.',
    icon: '📋',
  },
  {
    title: 'Analyze & Improve',
    description: 'View detailed statistics about your productivity, track streaks, set daily goals, and discover patterns in your work habits over time.',
    icon: '📊',
  },
  {
    title: 'Your Data is Private',
    description: 'Everything is stored locally in your browser. No accounts, no servers, no tracking. You can export your data anytime as a backup.',
    icon: '🔒',
  },
];

export function Onboarding() {
  const { completeOnboarding } = useStore();
  const [currentStep, setCurrentStep] = useState(0);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === currentStep ? 'w-8 bg-indigo-500' : 'w-2 bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">{step.icon}</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{step.description}</p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-0 disabled:pointer-events-none transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {isLast ? (
              <button
                onClick={completeOnboarding}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Get Started <Check className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Skip */}
          {!isLast && (
            <div className="text-center mt-4">
              <button
                onClick={completeOnboarding}
                className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                Skip tutorial
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
