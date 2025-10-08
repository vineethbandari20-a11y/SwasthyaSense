import React, { useState, useCallback } from 'react';
import { AnalysisResult, AnalysisType } from '../types';
import { analyzeDocument } from '../services/apiClient';
import { PrescriptionIcon, ScanIcon, CheckCircleIcon, ExclamationIcon, XCircleIcon } from './icons/Icons';

interface UploadProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

const UploadCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  onFileSelect: (file: File) => void;
}> = ({ title, description, icon, onFileSelect }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileSelect(event.target.files[0]);
    }
  };

  return (
    <label className="relative flex flex-col items-center justify-center w-full max-w-sm p-8 bg-light-navy border-2 border-dashed border-lightest-navy rounded-xl cursor-pointer hover:bg-lightest-navy transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1">
      <div className="text-secondary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-lightest-slate">{title}</h3>
      <p className="text-sm text-slate mt-1">{description}</p>
      <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
    </label>
  );
};

export const LoadingSpinner: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center space-y-4">
        <svg className="animate-spin h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg font-medium text-light-slate">{message}</p>
        <p className="text-sm text-slate">This may take a moment.</p>
    </div>
);

interface ResultCardProps {
    status: 'success' | 'warning' | 'error';
    message: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ status, message }) => {
    const statusConfig = {
        success: { icon: <CheckCircleIcon className="h-8 w-8 text-green-500"/>, color: 'green-500' },
        warning: { icon: <ExclamationIcon className="h-8 w-8 text-yellow-500"/>, color: 'yellow-500' },
        error: { icon: <XCircleIcon className="h-8 w-8 text-red-500"/>, color: 'red-500' },
    };

    const config = statusConfig[status];

    return (
        <div className={`flex items-center p-4 rounded-lg bg-${config.color}/10 border border-${config.color}/20 animate-slide-in-up`}>
            {config.icon}
            <p className={`ml-3 font-medium text-lightest-slate`}>{message}</p>
        </div>
    );
};


const Upload: React.FC<UploadProps> = ({ onAnalysisComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [interimResult, setInterimResult] = useState<ResultCardProps | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing analysis...');

  const handleFileUpload = useCallback(async (file: File, type: AnalysisType) => {
    setIsLoading(true);
    setInterimResult(null);
    try {
      const result = await analyzeDocument(file, type, "Patient", setLoadingMessage);
      
      let status: 'success' | 'warning' | 'error' = 'success';
      let message = 'Analysis complete. Preparing results...';
      if (result.riskLevel === 'Critical' || result.riskLevel === 'High') {
        status = 'error';
        message = `${result.riskLevel} risk detected. See details now.`;
      } else if (result.riskLevel === 'Medium') {
        status = 'warning';
        message = 'Potential issues found. Please review the report.';
      }

      setIsLoading(false);
      setInterimResult({ status, message });

      setTimeout(() => {
        onAnalysisComplete(result);
      }, 1500);

    } catch (error) {
      console.error("Analysis failed", error);
      setInterimResult({ status: 'error', message: 'An error occurred during analysis.' });
      setIsLoading(false);
    }
  }, [onAnalysisComplete]);

  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-200">Upload Your Medical Documents</h2>
        <p className="mt-2 text-md text-light-slate">Securely analyze prescriptions and diagnostic scans with our advanced AI.</p>
      </div>
      
      {isLoading && <LoadingSpinner message={loadingMessage} />}
      
      {!isLoading && !interimResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <UploadCard 
            title="Upload Prescription" 
            description="Accepts .jpg, .png, .pdf"
            icon={<PrescriptionIcon className="h-12 w-12" />}
            onFileSelect={(file) => handleFileUpload(file, AnalysisType.PRESCRIPTION)}
          />
          <UploadCard 
            title="Upload Scan" 
            description="X-Ray, ECG, MRI files"
            icon={<ScanIcon className="h-12 w-12" />}
            onFileSelect={(file) => handleFileUpload(file, AnalysisType.SCAN)}
          />
        </div>
      )}

      {interimResult && (
        <div className="mt-8 w-full max-w-xl">
          <ResultCard status={interimResult.status} message={interimResult.message} />
        </div>
      )}

    </div>
  );
};

export default Upload;