"use client";

import React, { useState, useCallback } from 'react';
import UploadScreen from '@/components/UploadScreen';
import InsightsScreen from '@/components/InsightsScreen';
import { AuthScreen } from '@/components/AuthScreen';
import { DocumentHistoryScreen } from '@/components/DocumentHistoryScreen';
import { Button } from '@/components/ui/button';
import { Scale, Upload, BarChart3, ArrowLeft, LogIn, User } from 'lucide-react';
import { Toaster } from 'sonner';

export default function HomePage() {
  const [currentScreen, setCurrentScreen] = useState<'upload' | 'insights' | 'auth' | 'history'>('upload');
  const [analysisData, setAnalysisData] = useState<{
    documentId: string;
    filename: string;
    analysisReady: boolean;
  } | null>(null);
  
  // Mock user state - you'll replace this with actual auth later
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleUploadComplete = useCallback((data: { 
    documentId: string; 
    filename: string; 
    analysisReady: boolean 
  }) => {
    setAnalysisData(data);
    setCurrentScreen('insights');
  }, []);

  const handleBackToUpload = useCallback(() => {
    setCurrentScreen('upload');
    setAnalysisData(null);
  }, []);

  const handleLoginClick = useCallback(() => {
    setCurrentScreen('auth');
  }, []);

  const handleBackFromAuth = useCallback(() => {
    setCurrentScreen('upload');
  }, []);

  const handleUserIconClick = useCallback(() => {
    if (isLoggedIn) {
      setCurrentScreen('history');
    } else {
      setCurrentScreen('auth');
    }
  }, [isLoggedIn]);

  const handleBackFromHistory = useCallback(() => {
    setCurrentScreen('insights');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-gradient-start via-background to-bg-gradient-end">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
                <Scale className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-xl font-bold text-foreground">LegalAnalyzer</h1>
                <p className="text-xs text-muted-foreground">Premium Contract Analysis</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              {/* Show login button when on upload screen */}
              {currentScreen === 'upload' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoginClick}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              )}
              
              {/* Show back button when on auth screen */}
              {currentScreen === 'auth' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackFromAuth}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}

              {/* Show back button when on history screen */}
              {currentScreen === 'history' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackFromHistory}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Analysis
                </Button>
              )}
              
              {/* Show only user icon when on insights screen */}
              {currentScreen === 'insights' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUserIconClick}
                  className="text-muted-foreground hover:text-foreground"
                  title={isLoggedIn ? "View Document History" : "Login to view history"}
                >
                  <User className="w-5 h-5" />
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <div className="container max-w-7xl mx-auto px-6 py-8">
          {/* Screen Transition */}
          <div className="transition-all duration-200 ease-in-out">
            {currentScreen === 'upload' && (
              <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <div className="w-full max-w-2xl">
                  <UploadScreen 
                    onComplete={handleUploadComplete}
                    className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
                  />
                </div>
              </div>
            )}

            {currentScreen === 'auth' && (
              <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
                <AuthScreen />
              </div>
            )}

            {currentScreen === 'history' && (
              <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
                <DocumentHistoryScreen />
              </div>
            )}

            {currentScreen === 'insights' && analysisData && (
              <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
                {/* Back Button */}
                <div className="mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToUpload}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Upload
                  </Button>
                </div>

                {/* Document Header */}
                <div className="mb-8 p-6 bg-card/60 backdrop-blur-sm rounded-xl border border-border shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-heading text-2xl font-bold text-foreground mb-1">
                        Analysis Complete
                      </h2>
                      <p className="text-muted-foreground">
                        Document: <span className="font-medium">{analysisData.filename}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Document ID: {analysisData.documentId}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        Analysis Ready
                      </div>
                    </div>
                  </div>
                </div>

                {/* Insights Screen Content */}
                <InsightsScreen />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Toast Notifications */}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--color-card)',
            color: 'var(--color-foreground)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
          },
        }}
      />
    </div>
  );
}