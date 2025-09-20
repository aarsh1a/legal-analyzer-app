"use client";
import Image from "next/image";

import React, { useState, useCallback, useRef } from 'react';
import { LandingPage } from '@/components/LandingPage';
import { UploadPage } from '@/components/UploadPage';
import { ResultsPage } from '@/components/ResultsPage';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  ArrowLeft
} from 'lucide-react';

type AppStep = 'landing' | 'upload' | 'results';

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<AppStep>('landing');
  const [analysisData, setAnalysisData] = useState<{
    documentId: string;
    filename: string;
    analysisReady: boolean;
    documentType?: string;
    additionalData?: any;
  } | null>(null);

  const handleGetStarted = useCallback(() => {
    setCurrentStep('upload');
  }, []);

  const handleAnalysisComplete = useCallback((data: { 
    documentId: string; 
    filename: string; 
    analysisReady: boolean;
    documentType?: string;
    additionalData?: any;
  }) => {
    setAnalysisData(data);
    setCurrentStep('results');
  }, []);

  const handleBackToLanding = useCallback(() => {
    setCurrentStep('landing');
    setAnalysisData(null);
  }, []);

  const handleNewAnalysis = useCallback(() => {
    setCurrentStep('upload');
    setAnalysisData(null);
  }, []);

  return (
    <div className="min-h-screen bg-white font-roboto">
      {/* Header */}
      <header className="google-header">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Google-style Logo */}
            <div 
              className="google-logo google-slide-in cursor-pointer" 
              onClick={handleBackToLanding}
            >
   <Image
  src="/logo.png"
  alt="App Logo"
  width={250}
  height={40}
  className="rounded-2xl shadow-lg"
/>



              
             
            </div>

            {/* Navigation & Powered by Gemini */}
            <div className="flex items-center gap-6">
              {/* Conditional Navigation */}
              {currentStep === 'landing' && (
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    onClick={handleGetStarted}
                    className="google-primary-button text-sm"
                  >
                    Get Started
                  </Button>
                </div>
              )}
              
              {currentStep !== 'landing' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToLanding}
                  className="google-button text-gray-700 hover:bg-gray-100"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}

              {/* Powered by Gemini Badge */}
              <div className="google-badge">
                <div className="w-4 h-4 mr-2 rounded-full bg-gradient-to-r from-google-blue via-google-red via-google-yellow to-google-green"></div>
                <span>Powered by Gemini</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {currentStep === 'landing' && (
          <LandingPage 
            onGetStarted={handleGetStarted}
          />
        )}

        {currentStep === 'upload' && (
          <UploadPage 
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}

        {currentStep === 'results' && analysisData && (
          <ResultsPage 
            analysisData={analysisData}
            onNewAnalysis={handleNewAnalysis}
          />
        )}
      </main>

      {/* Google-style Footer */}
      <footer className="border-t border-gray-100 bg-gray-50/50 py-12">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center gap-2 text-gray-600 font-roboto">
              <span>© 2025 Legal Analyzer by</span>
              <div className="flex items-center gap-1">
                <span className="font-google-sans font-medium text-google-blue">Google</span>
                <span className="font-google-sans font-medium text-google-red">A</span>
                <span className="font-google-sans font-medium text-google-yellow">I</span>
              </div>
            </div>
            <div className="flex items-center gap-8 text-sm">
              <a href="#" className="text-google-blue hover:underline font-roboto transition-colors">
                Contact
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 font-roboto transition-colors">
                Privacy
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 font-roboto transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}