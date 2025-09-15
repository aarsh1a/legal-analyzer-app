"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Send,
  Shield,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ResultsPageProps {
  analysisData: {
    documentId: string;
    filename: string;
    analysisReady: boolean;
    documentType?: string;
    additionalData?: {
      summary?: string;
      detailed_analysis?: {
        analysis: {
          actionable_advice: string;
          clause_category: string;
          risk_explanation: string;
          risk_level: string;
        };
        original_clause: string;
      }[];
    };
  };
  onNewAnalysis: () => void;
}

type TabType = "summary" | "flowchart";
type RiskLevel = "safe" | "neutral" | "risky";

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export function ResultsPage({ analysisData, onNewAnalysis }: ResultsPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("summary");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: `I've analyzed your ${
        analysisData.documentType || "legal document"
      }. What specific questions do you have about the terms or clauses?`,
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: chatInput,
      sender: "user",
      timestamp: new Date(),
    };

    const aiResponse: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: "I understand your concern. Let me analyze that clause in detail and provide specific recommendations based on legal best practices.",
      sender: "ai",
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage, aiResponse]);
    setChatInput("");
  };

  const getRiskLevel = (level: string): RiskLevel => {
    switch (level.toLowerCase()) {
      case "green":
        return "safe";
      case "yellow":
        return "neutral";
      case "red":
      default:
        return "risky";
    }
  };

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case "safe":
        return "text-google-green bg-google-green/10 border-google-green/20";
      case "neutral":
        return "text-google-yellow bg-google-yellow/10 border-google-yellow/20";
      case "risky":
        return "text-google-red bg-google-red/10 border-google-red/20";
    }
  };

  const getRiskIcon = (level: RiskLevel) => {
    switch (level) {
      case "safe":
        return <CheckCircle className="w-5 h-5" />;
      case "neutral":
        return <AlertTriangle className="w-5 h-5" />;
      case "risky":
        return <XCircle className="w-5 h-5" />;
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
                    Analysis completed •{" "}
                    {analysisData.documentType || "Legal Document"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-google-green/10 px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-google-green rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium font-google-sans text-google-green">
                    Analysis Ready
                  </span>
                </div>
                <Button
                  onClick={onNewAnalysis}
                  variant="outline"
                  className="google-button"
                >
                  New Analysis
                </Button>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="google-card bg-gradient-to-r from-google-blue/5 to-google-green/5 border border-gray-100 mb-8">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-google-blue" />
                <h3 className="text-xl font-google-sans font-medium text-gray-900">
                  Executive Summary
                </h3>
              </div>
              <div className="prose prose-blue max-w-none">
                <ReactMarkdown>
                  {analysisData.additionalData?.summary ||
                    "No summary available from analysis."}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side - Main Content (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="google-card">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6">
                    <button
                      onClick={() => setActiveTab("summary")}
                      className={`py-4 px-2 border-b-2 font-google-sans font-medium text-sm transition-colors ${
                        activeTab === "summary"
                          ? "border-google-blue text-google-blue"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Summary & Risk Assessment
                    </button>
                    <button
                      onClick={() => setActiveTab("flowchart")}
                      className={`py-4 px-2 border-b-2 font-google-sans font-medium text-sm transition-colors ${
                        activeTab === "flowchart"
                          ? "border-google-blue text-google-blue"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Flowchart
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === "summary" && (
                    <div className="space-y-8">
                      {/* Risk Flags Section */}
                      <div>
                        <h3 className="text-xl font-google-sans font-medium text-gray-900 mb-6">
                          Risk Flags
                        </h3>
                        <div className="space-y-4">
                          {analysisData.additionalData?.detailed_analysis?.map(
                            (item, idx) => {
                              const riskLevel = getRiskLevel(
                                item.analysis.risk_level
                              );
                              return (
                                <div
                                  key={idx}
                                  className={`google-card border-l-4 ${
                                    getRiskColor(riskLevel)
                                      .replace("text-", "border-")
                                      .split(" ")[0]
                                  }`}
                                >
                                  <div className="p-6 space-y-4">
                                    <div className="flex items-start gap-3">
                                      <div
                                        className={`p-2 rounded-full ${getRiskColor(
                                          riskLevel
                                        )}`}
                                      >
                                        {getRiskIcon(riskLevel)}
                                      </div>
                                      <div className="flex-1 space-y-4">
                                        <span
                                          className={`text-xs font-google-sans font-medium px-2 py-1 rounded-full ${getRiskColor(
                                            riskLevel
                                          )}`}
                                        >
                                          {item.analysis.risk_level.toUpperCase()}
                                        </span>
                                        <blockquote className="text-gray-800 font-roboto italic border-l-2 border-gray-200 pl-4 my-3 text-base leading-relaxed">
                                          {item.original_clause}
                                        </blockquote>

                                        {/* Bigger, Markdown-enabled sections */}
                                        <div className="space-y-3">
                                          <div>
                                            <h4 className="text-md font-google-sans font-semibold text-gray-900">
                                              Analysis
                                            </h4>
                                            <div className="prose prose-blue max-w-none text-gray-700 font-roboto text-base leading-relaxed">
                                              <ReactMarkdown>
                                                {
                                                  item.analysis
                                                    .risk_explanation
                                                }
                                              </ReactMarkdown>
                                            </div>
                                          </div>
                                          <div>
                                            <h4 className="text-md font-google-sans font-semibold text-gray-900">
                                              Recommendation
                                            </h4>
                                            <div className="prose prose-green max-w-none text-gray-700 font-roboto text-base leading-relaxed">
                                              <ReactMarkdown>
                                                {
                                                  item.analysis
                                                    .actionable_advice
                                                }
                                              </ReactMarkdown>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "flowchart" && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-xl font-google-sans font-medium text-gray-900 mb-4">
                          Document Decision Flow
                        </h3>
                        <p className="text-gray-600 font-roboto">
                          Interactive flowchart showing key decision points and
                          outcomes
                        </p>
                      </div>
                      {/* keep your flowchart design */}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Sticky Chatbot */}
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
                        <h3 className="font-google-sans font-medium text-gray-900">
                          Legal Assistant
                        </h3>
                        <p className="text-xs text-gray-500 font-roboto">
                          Powered by Gemini
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl ${
                            message.sender === "user"
                              ? "bg-google-blue text-white rounded-br-sm"
                              : "bg-gray-100 text-gray-800 rounded-bl-sm"
                          }`}
                        >
                          <p className="text-sm font-roboto leading-relaxed">
                            {message.text}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender === "user"
                                ? "text-blue-100"
                                : "text-gray-500"
                            }`}
                          >
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
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
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSendMessage()
                        }
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
