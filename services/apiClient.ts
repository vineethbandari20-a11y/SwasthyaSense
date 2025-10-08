import { AnalysisResult, AnalysisType } from '../types';
import { performAnalysisOnBackend } from './backendService';

// This function simulates the frontend making a network call to the backend API.
export const analyzeDocument = async (
  file: File,
  type: AnalysisType,
  userName: string,
  updateLoadingMessage: (message: string) => void
): Promise<AnalysisResult> => {
  console.log('[ApiClient] Initiating request to the backend...');
  updateLoadingMessage('Connecting to secure Azure backend...');
  
  // Simulate network latency for API call
  await new Promise(res => setTimeout(res, 800));
  updateLoadingMessage('Securely uploading document...');
  await new Promise(res => setTimeout(res, 500));
  
  // In a real app, this would be a fetch() call.
  // E.g., const response = await fetch('/api/analyze', { method: 'POST', body: formData });
  // For this simulation, we call the backend service directly.
  const result = await performAnalysisOnBackend(file, type, userName, updateLoadingMessage);

  console.log('[ApiClient] Received response from backend.');
  return result;
};
