"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Upload,
  FileText,
  CheckCircle,
  Eye,
  Languages,
  Zap,
  Sparkles
} from 'lucide-react';

interface UploadPageProps {
  onAnalysisComplete: (data: {
    documentId: string;
    filename: string;
    analysisReady: boolean;
    documentType?: string;
    additionalData?: any;
  }) => void;
}

type DocumentType = 'rental' | 'loan' | 'employability' | 'general';

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export function UploadPage({ onAnalysisComplete }: UploadPageProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('general');
  const [selectedState, setSelectedState] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [bankName, setBankName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analysisSteps = ['OCR', 'Translate', 'Summarize', 'Analyze'];

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.includes('pdf')) {
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        return;
      }
      
      setSelectedFile(file);
    }
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!selectedFile) return;
    
    setIsAnalyzing(true);
    setCurrentStep(0);
    
    // Simulate analysis progress
    const progressInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= analysisSteps.length - 1) {
          clearInterval(progressInterval);
          setTimeout(() => {
            onAnalysisComplete({
              documentId: `doc_${Date.now()}`,
              filename: selectedFile.name,
              analysisReady: true,
              documentType,
              additionalData: {
                state: selectedState,
                companyName,
                bankName
              }
            });
          }, 500);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
  }, [selectedFile, documentType, selectedState, companyName, bankName, onAnalysisComplete]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (isAnalyzing) {
    return (
      <div className="google-fade-in">
        <section className="pt-16 pb-20">
          <div className="container max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-google-sans font-medium text-gray-900 mb-4">
                Analyzing Your Document
              </h1>
              <p className="text-xl text-gray-600 font-roboto">
                Processing with advanced AI technology
              </p>
            </div>

            <div className="google-card-floating p-12 text-center space-y-8 max-w-lg mx-auto">
              {/* File Preview */}
              {selectedFile && (
                <div className="google-card bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-google-blue flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900 text-sm truncate">
                        {selectedFile.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        PDF • {formatFileSize(selectedFile.size)} • {documentType}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Steps */}
              <div className="space-y-6">
                <div className="google-loading-dots">
                  <div className="w-4 h-4 rounded-full google-loading-dot dot-1"></div>
                  <div className="w-4 h-4 rounded-full google-loading-dot dot-2"></div>
                  <div className="w-4 h-4 rounded-full google-loading-dot dot-3"></div>
                  <div className="w-4 h-4 rounded-full google-loading-dot dot-4"></div>
                </div>

                <div className="flex justify-center space-x-8">
                  {analysisSteps.map((step, index) => (
                    <div key={step} className="flex flex-col items-center space-y-2">
                      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                        index <= currentStep 
                          ? 'border-google-blue bg-google-blue text-white google-glow' 
                          : 'border-gray-300 text-gray-400'
                      }`}>
                        {index < currentStep ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : index === currentStep ? (
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <span className={`text-sm font-roboto transition-colors duration-300 ${
                        index <= currentStep ? 'text-google-blue font-medium' : 'text-gray-500'
                      }`}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="google-fade-in">
      <section className="pt-16 pb-20">
        <div className="container max-w-4xl mx-auto px-6">
          
          {/* Hero Title */}
          <div className="text-center mb-12 google-slide-in">
            <h1 className="text-4xl font-google-sans font-medium text-gray-900 mb-4">
              Upload Your Legal Document
            </h1>
            <p className="text-xl text-gray-600 font-roboto">
              Choose your document and specify its type for better analysis
            </p>
          </div>

          {/* Upload Form */}
          <div className="space-y-8">
            
            {/* Upload Card */}
            <div className="google-upload-card-floating">
              {!selectedFile ? (
                <div className="space-y-6">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-google-blue to-google-blue/80 rounded-3xl flex items-center justify-center google-icon-float">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-google-sans font-medium text-gray-900 mb-3">
                      Upload PDF Document
                    </h3>
                    <p className="text-gray-600 font-roboto">
                      Drag and drop your file here, or click to browse
                    </p>
                  </div>
                  <div className="space-y-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="google-primary-button w-full text-lg px-8 py-4 h-auto google-upload-hover"
                    >
                      <Upload className="w-6 h-6 mr-3" />
                      Choose File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleFileSelect}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="mx-auto w-20 h-20 bg-google-green/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-google-green" />
                  </div>
                  
                  <div className="google-card bg-gray-50 p-6">
                    <div className="flex items-center gap-4">
                      <FileText className="w-8 h-8 text-google-blue flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900 text-lg">
                          {selectedFile.name}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          PDF • {formatFileSize(selectedFile.size)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-google-blue hover:underline font-roboto"
                  >
                    Choose different file
                  </button>
                </div>
              )}
            </div>

            {/* Document Type Selection */}
            {selectedFile && (
              <div className="google-card-floating space-y-6">
                <h3 className="text-xl font-google-sans font-medium text-gray-900">
                  Select Document Type
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'rental', label: 'Rental Agreement', desc: 'Lease, rent agreements' },
                    { id: 'loan', label: 'Loan Document', desc: 'Personal, home, business loans' },
                    { id: 'employability', label: 'Employment Contract', desc: 'Job contracts, agreements' },
                    { id: 'general', label: 'General Legal', desc: 'Other legal documents' }
                  ].map((type) => (
                    <label key={type.id} className="cursor-pointer">
                      <input
                        type="radio"
                        name="documentType"
                        value={type.id}
                        checked={documentType === type.id}
                        onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                        className="sr-only"
                      />
                      <div className={`google-card border-2 transition-all duration-200 hover:shadow-md ${
                        documentType === type.id 
                          ? 'border-google-blue bg-google-blue/5' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="p-4 space-y-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
                              documentType === type.id 
                                ? 'border-google-blue bg-google-blue' 
                                : 'border-gray-300'
                            }`}>
                              {documentType === type.id && (
                                <div className="w-full h-full rounded-full bg-white scale-50"></div>
                              )}
                            </div>
                            <h4 className="font-google-sans font-medium text-gray-900">
                              {type.label}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 font-roboto ml-7">
                            {type.desc}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Conditional Fields */}
                {documentType === 'rental' && (
                  <div className="space-y-3">
                    <label className="block text-sm font-google-sans font-medium text-gray-900">
                      Choose Indian State
                    </label>
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-roboto focus:ring-2 focus:ring-google-blue focus:border-transparent"
                    >
                      <option value="">Select a state...</option>
                      {indianStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                )}

                {documentType === 'loan' && (
                  <div className="space-y-3">
                    <label className="block text-sm font-google-sans font-medium text-gray-900">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Enter bank name..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-roboto focus:ring-2 focus:ring-google-blue focus:border-transparent"
                    />
                  </div>
                )}

                {documentType === 'employability' && (
                  <div className="space-y-3">
                    <label className="block text-sm font-google-sans font-medium text-gray-900">
                      Company Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter company name..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-roboto focus:ring-2 focus:ring-google-blue focus:border-transparent"
                    />
                  </div>
                )}

                {/* Analyze Button */}
                <Button
                  onClick={handleAnalyze}
                  disabled={!selectedFile}
                  className="google-cta-button w-full text-lg px-8 py-4 h-auto"
                >
                  <Sparkles className="w-6 h-6 mr-3" />
                  Analyze Document
                </Button>
              </div>
            )}

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 google-feature-icon" style={{'--bg-color': '#e3f2fd', '--bg-color-dark': '#bbdefb'}}>
                  <Eye className="w-8 h-8 text-google-blue" />
                </div>
                <div>
                  <h4 className="font-google-sans font-medium text-gray-900 text-lg">OCR Ready</h4>
                  <p className="text-gray-600 font-roboto">Process scanned documents</p>
                </div>
              </div>
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 google-feature-icon" style={{'--bg-color': '#e8f5e8', '--bg-color-dark': '#c8e6c9'}}>
                  <Languages className="w-8 h-8 text-google-green" />
                </div>
                <div>
                  <h4 className="font-google-sans font-medium text-gray-900 text-lg">Multilingual</h4>
                  <p className="text-gray-600 font-roboto">Auto-translate to English</p>
                </div>
              </div>
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 google-feature-icon" style={{'--bg-color': '#fff3e0', '--bg-color-dark': '#ffe0b2'}}>
                  <Zap className="w-8 h-8 text-google-yellow" />
                </div>
                <div>
                  <h4 className="font-google-sans font-medium text-gray-900 text-lg">AI Powered</h4>
                  <p className="text-gray-600 font-roboto">Advanced Gemini analysis</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}