"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Send,
  Plus,
  Minus,
  ArrowRight,
  Shield,
  Scale,
  Clock,
  TrendingUp
} from 'lucide-react';

interface ResultsPageProps {
  analysisData: {
    documentId: string;
    filename: string;
    analysisReady: boolean;
    documentType?: string;
    additionalData?: any;
  };
  onNewAnalysis: () => void;
}

type TabType = 'summary' | 'flowchart';
type RiskLevel = 'safe' | 'neutral' | 'risky';

interface RiskClause {
  id: string;
  text: string;
  riskLevel: RiskLevel;
  explanation: string;
  advice: string;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const mockSummary = {
  documentType: "Rental Agreement",
  keyPoints: [
    "Monthly rent: ₹25,000 due on 1st of every month",
    "Security deposit: ₹50,000 (refundable)",
    "Lease term: 11 months starting January 1, 2025",
    "Notice period: 30 days required for termination"
  ],
  overallRisk: "Low to Medium",
  recommendedActions: [
    "Review utility payment clauses",
    "Clarify maintenance responsibilities", 
    "Confirm security deposit return conditions"
  ]
};

const mockRiskClauses: RiskClause[] = [
  {
    id: "1",
    text: "The tenant shall pay rent on or before the 1st day of every month failing which a penalty of 2% per day will be charged.",
    riskLevel: "neutral",
    explanation: "Standard rent payment clause with penalty provision.",
    advice: "The 2% daily penalty is reasonable but ensure you understand the exact calculation method."
  },
  {
    id: "2", 
    text: "The landlord reserves the right to terminate this agreement with 15 days notice without stating any reason.",
    riskLevel: "risky",
    explanation: "This clause gives excessive power to the landlord and may leave you vulnerable.",
    advice: "Negotiate for mutual termination rights or request 30-day notice period to align with standard practices."
  },
  {
    id: "3",
    text: "Security deposit will be refunded within 45 days of lease termination after deducting any damages.",
    riskLevel: "safe",
    explanation: "Fair timeline for security deposit return with clear conditions.",
    advice: "Document the property condition at move-in to protect against unfair damage claims."
  },
  {
    id: "4",
    text: "Tenant is responsible for all repairs and maintenance regardless of the cause.",
    riskLevel: "risky",
    explanation: "This shifts all maintenance responsibility to tenant, which is unusual and potentially unfair.",
    advice: "Negotiate to limit tenant responsibility to minor repairs and maintenance caused by tenant negligence only."
  }
];

export function ResultsPage({ analysisData, onNewAnalysis }: ResultsPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: `I've analyzed your ${analysisData.documentType || 'legal document'}. What specific questions do you have about the terms or clauses?`,
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: chatInput,
      sender: 'user',
      timestamp: new Date()
    };

    const aiResponse: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: "I understand your concern. Let me analyze that clause in detail and provide specific recommendations based on legal best practices.",
      sender: 'ai',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage, aiResponse]);
    setChatInput('');
  };

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'safe': return 'text-google-green bg-google-green/10 border-google-green/20';
      case 'neutral': return 'text-google-yellow bg-google-yellow/10 border-google-yellow/20';
      case 'risky': return 'text-google-red bg-google-red/10 border-google-red/20';
    }
  };

  const getRiskIcon = (level: RiskLevel) => {
    switch (level) {
      case 'safe': return <CheckCircle className="w-5 h-5" />;
      case 'neutral': return <AlertTriangle className="w-5 h-5" />;
      case 'risky': return <XCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="google-fade-in">
      <section className="py-8">
        <div className="container max-w-7xl mx-auto px-6">
          
          {/* Document Header */}
          <div className="google-card p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-google-blue/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-google-blue" />
                </div>
                <div>
                  <h1 className="font-google-sans text-2xl font-medium text-gray-900">
                    {analysisData.filename}
                  </h1>
                  <p className="text-gray-600 font-roboto">
                    Analysis completed • {analysisData.documentType || 'Legal Document'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-google-green/10 px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-google-green rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium font-google-sans text-google-green">Analysis Ready</span>
                </div>
                <Button onClick={onNewAnalysis} variant="outline" className="google-button">
                  New Analysis
                </Button>
              </div>
            </div>
          </div>

          {/* Executive Summary - Moved Outside and Above */}
          <div className="google-card bg-gradient-to-r from-google-blue/5 to-google-green/5 border border-gray-100 mb-8">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-google-blue" />
                <h3 className="text-xl font-google-sans font-medium text-gray-900">
                  Executive Summary
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-google-sans font-medium text-gray-900 mb-3">Key Points</h4>
                  <ul className="space-y-2">
                    {mockSummary.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700 font-roboto">
                        <div className="w-1.5 h-1.5 bg-google-blue rounded-full mt-2 flex-shrink-0"></div>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-google-sans font-medium text-gray-900 mb-3">Recommended Actions</h4>
                  <ul className="space-y-2">
                    {mockSummary.recommendedActions.map((action, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700 font-roboto">
                        <ArrowRight className="w-4 h-4 text-google-green mt-0.5 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-google-yellow" />
                  <span className="font-google-sans font-medium text-gray-900">Overall Risk Level:</span>
                  <span className="font-roboto text-google-yellow">{mockSummary.overallRisk}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Side - Main Content (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Tab Navigation */}
              <div className="google-card">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6">
                    <button
                      onClick={() => setActiveTab('summary')}
                      className={`py-4 px-2 border-b-2 font-google-sans font-medium text-sm transition-colors ${
                        activeTab === 'summary'
                          ? 'border-google-blue text-google-blue'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Summary & Risk Assessment
                    </button>
                    <button
                      onClick={() => setActiveTab('flowchart')}
                      className={`py-4 px-2 border-b-2 font-google-sans font-medium text-sm transition-colors ${
                        activeTab === 'flowchart'
                          ? 'border-google-blue text-google-blue'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Flowchart
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'summary' && (
                    <div className="space-y-8">
                      
                      {/* Summary Section (from JSON) */}
                      <div>
                        <h3 className="text-xl font-google-sans font-medium text-gray-900 mb-4">
                          Summary
                        </h3>
                        <div className="google-card bg-gray-50">
                          <div className="p-4">
                            <p className="text-gray-800 font-roboto leading-relaxed">
                              This is a detailed summary that will be returned by JSON analysis. It provides comprehensive insights into the document structure, key terms, and important provisions that require attention.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Risk Flags Section */}
                      <div>
                        <h3 className="text-xl font-google-sans font-medium text-gray-900 mb-6">
                          Risk Flags
                        </h3>
                        <div className="space-y-4">
                          {mockRiskClauses.map((clause) => (
                            <div key={clause.id} className={`google-card border-l-4 ${getRiskColor(clause.riskLevel).replace('text-', 'border-').split(' ')[0]}`}>
                              <div className="p-6 space-y-4">
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-full ${getRiskColor(clause.riskLevel)}`}>
                                    {getRiskIcon(clause.riskLevel)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className={`text-xs font-google-sans font-medium px-2 py-1 rounded-full ${getRiskColor(clause.riskLevel)}`}>
                                        {clause.riskLevel.toUpperCase()}
                                      </span>
                                    </div>
                                    <blockquote className="text-gray-800 font-roboto italic border-l-2 border-gray-200 pl-4 mb-3">
                                      {clause.text}
                                    </blockquote>
                                    <div className="space-y-2">
                                      <p className="text-gray-700 font-roboto text-sm">
                                        <strong>Analysis:</strong> {clause.explanation}
                                      </p>
                                      <p className="text-gray-700 font-roboto text-sm">
                                        <strong>Recommendation:</strong> {clause.advice}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'flowchart' && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-xl font-google-sans font-medium text-gray-900 mb-4">
                          Document Decision Flow
                        </h3>
                        <p className="text-gray-600 font-roboto">
                          Interactive flowchart showing key decision points and outcomes
                        </p>
                      </div>

                      {/* Interactive Flowchart */}
                      <div className="google-card bg-gray-50 p-8">
                        <div className="flex flex-col items-center space-y-6">
                          
                          {/* Start Node */}
                          <div className="google-flowchart-node bg-google-blue text-white">
                            <div className="font-google-sans font-medium">Document Analysis</div>
                            <div className="text-sm opacity-90">{analysisData.documentType || 'Legal Document'}</div>
                          </div>

                          <div className="w-px h-8 bg-google-blue google-glow"></div>

                          {/* Decision Nodes */}
                          <div className="google-flowchart-node bg-google-yellow text-gray-900 border-2 border-google-yellow">
                            <div className="text-sm font-google-sans">Key Decision Point</div>
                            <div className="font-medium">Termination Rights</div>
                          </div>

                          <div className="flex items-center space-x-8">
                            <div className="flex flex-col items-center space-y-2">
                              <div className="w-20 h-px bg-google-green"></div>
                              <div className="google-flowchart-node bg-google-green text-white text-sm">
                                Mutual Rights
                              </div>
                            </div>
                            <div className="flex flex-col items-center space-y-2">
                              <div className="w-20 h-px bg-google-red"></div>
                              <div className="google-flowchart-node bg-google-red text-white text-sm">
                                One-sided Rights
                              </div>
                            </div>
                          </div>

                          <div className="w-px h-8 bg-gray-300"></div>

                          {/* Outcome Node */}
                          <div className="google-flowchart-node bg-gray-100 border-2 border-gray-300 text-gray-800">
                            <div className="text-sm font-google-sans">Recommendation</div>
                            <div className="font-medium">Negotiate Terms</div>
                          </div>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="google-card">
                        <div className="p-4">
                          <h4 className="font-google-sans font-medium text-gray-900 mb-4">Legend</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-google-green rounded"></div>
                              <span className="text-sm font-roboto text-gray-700">Favorable Terms</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-google-red rounded"></div>
                              <span className="text-sm font-roboto text-gray-700">Risky Terms</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-google-yellow rounded"></div>
                              <span className="text-sm font-roboto text-gray-700">Decision Points</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-google-blue rounded"></div>
                              <span className="text-sm font-roboto text-gray-700">Process Steps</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Sticky Chatbot (1/3 width) */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="google-card h-[600px] flex flex-col">
                  
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-google-blue to-google-green rounded-full flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-google-sans font-medium text-gray-900">Legal Assistant</h3>
                        <p className="text-xs text-gray-500 font-roboto">Powered by Gemini</p>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map((message) => (
                      <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl ${
                          message.sender === 'user'
                            ? 'bg-google-blue text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}>
                          <p className="text-sm font-roboto leading-relaxed">{message.text}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask about your document..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm font-roboto focus:ring-2 focus:ring-google-blue focus:border-transparent"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim()}
                        size="sm"
                        className="rounded-full w-8 h-8 p-0 bg-google-blue hover:bg-google-blue/90"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}