"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Zap, Sparkles } from "lucide-react";
import { analyzeDocument } from "@/utils/api";
interface AdditionalData {
  state?: string;
  companyName?: string;
  bankName?: string;
  keyEntities?: any; // refine later
  calendarEvents?: any;
  summary?: string;
  detailedAnalysis?: {
    analysis: {
      actionable_advice: string;
      clause_category: string;
      risk_explanation: string;
      risk_level: string;
    };
    original_clause: string;
  }[];
  flowchart?: string;
}

interface UploadPageProps {
  onAnalysisComplete: (data: {
    documentId: string;
    filename: string;
    analysisReady: boolean;
    additionalData?:  AdditionalData;
  }) => void;
}

export function UploadPage({ onAnalysisComplete }: UploadPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pdfjsLib, setPdfjsLib] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamically load pdfjs-dist on client
  useEffect(() => {
    (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      setPdfjsLib(pdfjs);
    })();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setProgress(0);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    if (!pdfjsLib) throw new Error("PDF.js not loaded yet");

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(" ") + "\n";

      setProgress(Math.round((i / pdf.numPages) * 100));
    }

    return text.trim();
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF before uploading.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Extract text from PDF
      const extractedText = await extractTextFromPDF(file);

      // Send text to backend
      const data = await analyzeDocument(extractedText);

      onAnalysisComplete({
        documentId: Date.now().toString(),
        filename: file.name,
        analysisReady: true,
        additionalData: {
            state: undefined, // or get it from your UI/form
    companyName: undefined, // same here
    bankName: undefined, // same here
    keyEntities: data.key_entities,          // snake_case → camelCase
    calendarEvents: data.calendar_events,    // snake_case → camelCase
    summary: data.summary,
    detailedAnalysis: data.detailed_analysis,
    flowchart: data.flowchart,
        },
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Failed to upload and analyze document. Please try again.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="google-fade-in">
  <section className="py-16">
    <div className="container max-w-3xl mx-auto px-6 text-center">
      <div className="google-card p-8">

        {/* --- Conditional: Analyzing UI or Upload UI --- */}
        {loading ? (
          // --- Analyzing UI ---
          <div className="flex flex-col items-center gap-6">
            <h2 className="text-xl font-semibold">Analyzing Your Document</h2>
            <p className="text-gray-500">Processing with advanced AI technology</p>

            {file && (
              <div className="border rounded-xl p-4 w-full text-left">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  PDF • {(file.size / 1024).toFixed(1)} KB • general
                </p>
              </div>
            )}

          <div className="flex justify-between w-full mt-6">
  {["OCR", "Translate", "Summarize", "Analyze"].map((label, i) => {
    const colors = ["#4285F4", "#EA4335", "#FBBC05", "#34A853"]; // Google colors
    const isActive = progress / 25 >= i + 1; // progress logic
    return (
      <div key={label} className="flex flex-col items-center">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white"
          style={{
            backgroundColor: isActive ? colors[i] : "#E0E0E0", // gray if not active
          }}
        >
          {i + 1}
        </div>
        <span className="text-sm mt-2">{label}</span>
      </div>
    );
  })}
</div>


            <p className="text-sm text-gray-500 mt-4">
              {progress > 0 ? `Step ${Math.ceil(progress / 25)} of 4` : "Initializing..."}
            </p>
          </div>
        ) : (
          // --- Upload UI ---
          <div className="flex flex-col items-center gap-6">
            {/* Icon */}
            <div className="w-16 h-16 bg-google-blue/10 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-google-blue" />
            </div>

            {/* Title */}
            <h1 className="font-google-sans text-3xl font-medium text-gray-900">
              Upload Your Legal Document
            </h1>
            <p className="text-gray-600 font-roboto max-w-md">
              Securely upload agreements, contracts, or legal papers. Our AI
              will analyze risks and give you actionable insights.
            </p>

            {/* File Input (hidden) */}
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
            />

            {/* Choose PDF button */}
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="google-button"
            >
              <FileText className="w-4 h-4 mr-2" />
              Choose PDF
            </Button>

            {/* File Selected Preview */}
            {file && (
              <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border">
                <FileText className="w-5 h-5 text-google-blue" />
                <span className="text-sm font-roboto text-gray-800">
                  {file.name}
                </span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <p className="text-sm text-google-red font-roboto">{error}</p>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!file || loading || !pdfjsLib}
              className="google-button w-full"
            >
              {loading ? (
                <Zap className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {loading
                ? `Analyzing... ${progress > 0 ? progress + "%" : ""}`
                : "Start Analysis"}
            </Button>
          </div>
        )}

      </div>
    </div>
  </section>
</div>

  );
}
