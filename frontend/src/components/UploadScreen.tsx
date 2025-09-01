"use client";

import React, { useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Upload, FileCheck, FileX2, HardDriveUpload } from 'lucide-react';
import { toast } from 'sonner';

interface UploadScreenProps {
  onComplete?: (data: { documentId: string; filename: string; analysisReady: boolean }) => void;
  className?: string;
}

interface FileState {
  file: File | null;
  status: 'idle' | 'selected' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  error?: string;
}

export default function UploadScreen({ onComplete, className }: UploadScreenProps) {
  const [fileState, setFileState] = useState<FileState>({
    file: null,
    status: 'idle',
    progress: 0,
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): boolean => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please select a PDF file only');
      return false;
    }
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast.error('File size must be less than 50MB');
      return false;
    }
    return true;
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!validateFile(file)) return;

    setFileState({
      file,
      status: 'selected',
      progress: 0,
    });
  }, [validateFile]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const simulateUpload = useCallback(async () => {
    if (!fileState.file) return;

    setFileState(prev => ({ ...prev, status: 'uploading', progress: 0 }));

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setFileState(prev => ({ ...prev, progress: i }));
    }

    // Start processing
    setFileState(prev => ({ ...prev, status: 'processing', progress: 100 }));
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Complete successfully
    setFileState(prev => ({ ...prev, status: 'success' }));
    toast.success('Document uploaded and processed successfully!');
  }, [fileState.file]);

  const handleAnalyze = useCallback(() => {
    if (fileState.file && fileState.status === 'success') {
      const analysisData = {
        documentId: `doc_${Date.now()}`,
        filename: fileState.file.name,
        analysisReady: true,
      };
      onComplete?.(analysisData);
    }
  }, [fileState.file, fileState.status, onComplete]);

  const handleRetry = useCallback(() => {
    setFileState({
      file: null,
      status: 'idle',
      progress: 0,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-100 text-blue-700';
      case 'processing':
        return 'bg-yellow-100 text-yellow-700';
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing (OCR & analysis prepping)';
      case 'success':
        return 'Ready for analysis';
      case 'error':
        return 'Upload failed';
      default:
        return 'Ready to upload';
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Upload Form */}
      <div className="w-full">
        <Card className="bg-card shadow-lg border-border">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
                Upload Your Legal Document
              </h1>
              <p className="text-muted-foreground">
                Professional contract analysis powered by AI
              </p>
            </div>

            {/* Drag and Drop Zone */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? 'border-primary bg-muted/50'
                  : fileState.status === 'idle' || fileState.status === 'error'
                  ? 'border-border hover:border-muted-foreground'
                  : 'border-muted'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="p-3 rounded-full bg-accent/20">
                    <HardDriveUpload className="h-8 w-8 text-primary" />
                  </div>
                </div>

                {/* Upload Button or Status */}
                {fileState.status === 'idle' && (
                  <>
                    <div>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose PDF File
                      </Button>
                      <p className="text-sm text-muted-foreground mt-2">
                        or drag and drop your file here
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PDF only • Scanned PDFs will be converted to text via Google OCR • Non-English files auto-translated to English
                    </p>
                  </>
                )}

                {fileState.file && (
                  <div className="space-y-4">
                    {/* File Info */}
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileCheck className="h-5 w-5 text-muted-foreground" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">
                            {fileState.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(fileState.file.size)}
                          </p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(fileState.status)}`}>
                        {getStatusText(fileState.status)}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {(fileState.status === 'uploading' || fileState.status === 'processing') && (
                      <div className="space-y-2">
                        <Progress 
                          value={fileState.status === 'processing' ? undefined : fileState.progress}
                          className="w-full"
                        />
                        {fileState.status === 'uploading' && (
                          <p className="text-xs text-muted-foreground text-center">
                            {fileState.progress}% uploaded
                          </p>
                        )}
                        {fileState.status === 'processing' && (
                          <p className="text-xs text-muted-foreground text-center">
                            Typical processing: 20–60s
                          </p>
                        )}
                      </div>
                    )}

                    {/* Error State */}
                    {fileState.status === 'error' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center space-x-2 text-destructive">
                          <FileX2 className="h-4 w-4" />
                          <span className="text-sm">
                            {fileState.error || 'Upload failed. Please try again.'}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRetry}
                          className="w-full"
                        >
                          Try Again
                        </Button>
                      </div>
                    )}

                    {/* Upload Button */}
                    {fileState.status === 'selected' && (
                      <Button
                        onClick={simulateUpload}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Analyze Button */}
            {fileState.status === 'success' && (
              <div className="mt-8">
                <Button
                  onClick={handleAnalyze}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold py-3"
                  size="lg"
                >
                  Analyze Document
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Security Notice */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          Your data is processed securely — documents are transmitted using TLS and stored only for processing.
        </p>
      </div>

      {/* Hidden File Input */}
      <Input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".pdf,application/pdf"
        className="hidden"
      />
    </div>
  );
}