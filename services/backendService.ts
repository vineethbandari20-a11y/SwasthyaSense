// --- SIMULATION ---
// This file simulates a backend service, like a C# .NET API running on Microsoft Azure.
// In a real-world scenario, this code would not be in the frontend. The frontend would
// make an API call to a URL, and the server at that URL would execute this logic.
// The Gemini API key would be stored securely on the server, not exposed to the browser.
// --- END SIMULATION ---

import { AnalysisResult, AnalysisType, PatientInfo, RiskLevel, Medication, ScanFinding } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize the Google GenAI client
// On a real backend, process.env.API_KEY would be read from server environment variables.
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

const generateRandomId = () => Math.random().toString(36).substring(2, 9);

const generatePatientInfo = (userName: string): PatientInfo => ({
    name: userName, // Use the logged-in user's name
    id: `P${Math.floor(100000 + Math.random() * 900000)}`,
    dob: '1985-05-22',
});

const generateHeatmapUrl = () => {
    // This is a simple SVG to simulate a heatmap overlay
    const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style="stop-color:rgba(255,0,0,0.8);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgba(255,255,0,0);stop-opacity:0" />
        </radialGradient>
      </defs>
      <rect width="512" height="512" fill="none" />
      <circle cx="256" cy="200" r="100" fill="url(#grad1)" />
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

// New helper function to convert a File object to the format required by the Gemini API
const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // remove the data:mime/type;base64, prefix
            resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: await base64EncodedDataPromise,
            mimeType: file.type,
        },
    };
};

// This is the core logic that would run on the server.
export const performAnalysisOnBackend = async (file: File, type: AnalysisType, userName: string, updateLoadingMessage: (message: string) => void): Promise<AnalysisResult> => {
    console.log(`[BackendService] Analyzing document for ${userName} - ${type}: ${file.name}`);
    
    updateLoadingMessage(type === AnalysisType.SCAN ? 'AI is analyzing your scan...' : 'AI is analyzing your prescription...');

    const fileUrl = await fileToBase64(file);
    const patientInfo = generatePatientInfo(userName);

    if (type === AnalysisType.PRESCRIPTION) {
        try {
            const imagePart = await fileToGenerativePart(file);
            const textPart = {
                text: `You are a world-class clinical pharmacist AI assistant. Your purpose is to analyze medical prescriptions with extreme precision. Analyze the provided prescription image. Extract each medication, its dosage, and frequency. Verify this information against standard medical guidelines. Identify any potential drug-drug interactions, incorrect dosages, or other safety concerns. Provide a detailed technical summary for a medical professional and a simplified, easy-to-understand summary for the patient. Assess the overall risk level and provide a safety score. Your analysis must be consistent and reproducible. The output must be a single, valid JSON object that strictly adheres to the provided schema. Do not include any markdown formatting like \`\`\`json.`
            };
            const schema = {
                type: Type.OBJECT,
                properties: {
                    riskLevel: {
                        type: Type.STRING,
                        enum: ['Low', 'Medium', 'High', 'Critical'],
                        description: 'Overall risk level based on findings.'
                    },
                    safetyScore: {
                        type: Type.INTEGER,
                        description: 'A score from 0 to 100 indicating the safety and correctness of the prescription. 100 is perfectly safe, 0 is critically dangerous.'
                    },
                    medications: {
                        type: Type.ARRAY,
                        description: 'A list of all medications found on the prescription.',
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: 'The name of the medication and its strength (e.g., "Lisinopril 10mg").' },
                                dosage: { type: Type.STRING, description: 'The prescribed dosage and frequency (e.g., "1 tablet daily").' },
                                status: { type: Type.STRING, enum: ['Verified', 'Interaction Warning', 'Incorrect Dosage'], description: 'The verification status of the medication.' },
                                notes: { type: Type.STRING, description: 'A patient-friendly note about the medication.' },
                                technicalNotes: { type: Type.STRING, description: 'A technical note for healthcare professionals.' }
                            },
                            required: ['name', 'dosage', 'status', 'notes', 'technicalNotes']
                        }
                    },
                    summary: {
                        type: Type.STRING,
                        description: 'A detailed technical summary for a medical professional.'
                    },
                    patientFriendlySummary: {
                        type: Type.STRING,
                        description: 'A simplified summary for the patient, explaining the findings in easy-to-understand language.'
                    }
                },
                required: ['riskLevel', 'safetyScore', 'medications', 'summary', 'patientFriendlySummary']
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                    temperature: 0.1, // Lower temperature for more deterministic results
                    systemInstruction: "You are a highly precise clinical pharmacist AI. Accuracy and consistency are paramount. Base your analysis strictly on the provided image and established medical guidelines."
                },
            });

            const resultData = JSON.parse(response.text);

            return {
                id: generateRandomId(),
                date: Date.now(),
                type: AnalysisType.PRESCRIPTION,
                uploadedFile: { name: file.name, url: fileUrl, type: file.type },
                patientInfo: patientInfo,
                riskLevel: resultData.riskLevel,
                safetyScore: resultData.safetyScore,
                medications: resultData.medications,
                summary: resultData.summary,
                patientFriendlySummary: resultData.patientFriendlySummary,
            };

        } catch (error) {
             console.error("Error analyzing prescription with Gemini:", error);
            // Provide a fallback error response
            return {
                id: generateRandomId(),
                date: Date.now(),
                type: AnalysisType.PRESCRIPTION,
                uploadedFile: { name: file.name, url: fileUrl, type: file.type },
                patientInfo: patientInfo,
                riskLevel: RiskLevel.MEDIUM,
                safetyScore: 50,
                medications: [{ name: 'Analysis Failed', dosage: 'N/A', status: 'Incorrect Dosage', notes: 'Could not analyze prescription.', technicalNotes: 'API Error' }],
                summary: 'The AI analysis could not be completed due to a technical error. Please try again or use a different file.',
                patientFriendlySummary: 'We\'re sorry, but there was an error analyzing your prescription. Please try uploading it again.',
            };
        }

    } else { // It's a scan - USE GEMINI API
        try {
            const imagePart = await fileToGenerativePart(file);

            const lowerCaseFileName = file.name.toLowerCase();
            let promptText: string;

            if (lowerCaseFileName.includes('x-ray') || lowerCaseFileName.includes('xray') || lowerCaseFileName.includes('radiograph')) {
                promptText = `CRITICAL MEDICAL TASK: You are a world-class radiologist AI assistant specializing in X-ray interpretation. Your primary function is to analyze X-ray images with the highest degree of accuracy. Errors can have serious consequences.
Analyze the provided X-ray image. Meticulously identify any and all abnormalities, paying close attention to:
- Fractures (hairline, displaced, comminuted)
- Lung conditions (nodules, masses, pneumonia, pleural effusion, pneumothorax)
- Joint dislocations or signs of arthritis
- Foreign objects
For each finding, specify its precise anatomical location and severity. Provide a comprehensive technical summary for a medical professional, including potential differential diagnoses. Also, generate a simplified, clear summary for the patient. Finally, assess the overall risk level and provide a safety score reflecting your confidence in the scan's normality.
Your analysis must be consistent and reproducible. The output must be a single, valid JSON object that strictly adheres to the provided schema. Do not include any markdown formatting or extraneous text.`;
            } else if (lowerCaseFileName.includes('ecg') || lowerCaseFileName.includes('ekg') || lowerCaseFileName.includes('electrocardiogram')) {
                promptText = `CRITICAL MEDICAL TASK: You are a world-class cardiologist AI assistant specializing in ECG interpretation. Your primary function is to analyze electrocardiogram (ECG/EKG) traces with the highest degree of accuracy. Errors can have serious consequences.
Analyze the provided ECG image. Meticulously identify any and all abnormalities, paying close attention to:
- Rate and rhythm (e.g., tachycardia, bradycardia, atrial fibrillation, flutter)
- Axis deviation
- Signs of ischemia or infarction (ST elevation/depression, T-wave inversion, Q waves)
- Evidence of hypertrophy (ventricular or atrial)
- Conduction abnormalities (e.g., bundle branch blocks, AV blocks)
For each finding, specify its characteristics and location (e.g., which leads are affected). Provide a comprehensive technical summary for a medical professional, including potential diagnoses. Also, generate a simplified, clear summary for the patient. Finally, assess the overall risk level and provide a safety score reflecting your confidence in the ECG's normality.
Your analysis must be consistent and reproducible. The output must be a single, valid JSON object that strictly adheres to the provided schema. Do not include any markdown formatting or extraneous text.`;
            } else if (lowerCaseFileName.includes('mri') || lowerCaseFileName.includes('magnetic resonance')) {
                promptText = `CRITICAL MEDICAL TASK: You are a world-class radiologist AI assistant specializing in MRI interpretation. Your primary function is to analyze Magnetic Resonance Imaging (MRI) scans with the highest degree of accuracy, focusing on soft tissue. Errors can have serious consequences.
Analyze the provided MRI image. Meticulously identify any and all abnormalities, paying close attention to:
- Soft tissue abnormalities (lesions, tumors, cysts)
- Inflammation or infection
- Ligament or tendon tears
- Signs of neurological conditions (e.g., in brain MRIs, look for plaques, tumors, signs of stroke)
- Degenerative changes in joints or the spine
For each finding, specify its precise anatomical location, size, and characteristics (e.g., signal intensity). Provide a comprehensive technical summary for a medical professional. Also, generate a simplified, clear summary for the patient. Finally, assess the overall risk level and provide a safety score reflecting your confidence in the scan's normality.
Your analysis must be consistent and reproducible. The output must be a single, valid JSON object that strictly adheres to the provided schema. Do not include any markdown formatting or extraneous text.`;
            } else {
                promptText = `CRITICAL MEDICAL TASK: You are a world-class radiologist AI assistant. Your primary function is to analyze medical scans with the highest degree of accuracy and provide detailed, structured reports suitable for clinical use. Errors can have serious consequences. Analyze the provided medical image. Meticulously identify any and all abnormalities, such as fractures, nodules, masses, inflammation, or fluid buildup. For each finding, specify its precise anatomical location and severity. Provide a comprehensive technical summary for a medical professional, including potential differential diagnoses if applicable. Also, generate a simplified, clear summary for the patient. Finally, assess the overall risk level and provide a safety score reflecting your confidence in the scan's normality. Your analysis must be consistent and reproducible. The output must be a single, valid JSON object that strictly adheres to the provided schema. Do not include any markdown formatting or extraneous text.`;
            }
            
            const textPart = { text: promptText };
            
            const schema = {
              type: Type.OBJECT,
              properties: {
                riskLevel: {
                  type: Type.STRING,
                  enum: ['Low', 'Medium', 'High', 'Critical'],
                  description: 'Overall risk level based on findings.'
                },
                safetyScore: {
                  type: Type.INTEGER,
                  description: 'A score from 0 to 100 indicating the confidence in the scan being normal. 100 is perfectly normal, 0 is critically abnormal.'
                },
                scanFindings: {
                  type: Type.ARRAY,
                  description: 'A list of all observed findings in the scan.',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      finding: { type: Type.STRING, description: 'A concise description of the specific finding.' },
                      location: { type: Type.STRING, description: 'The anatomical location of the finding.' },
                      severity: { type: Type.STRING, enum: ['Mild', 'Moderate', 'Severe'], description: 'The severity of the finding.' }
                    },
                    required: ['finding', 'location', 'severity']
                  }
                },
                summary: {
                  type: Type.STRING,
                  description: 'A detailed technical summary for a medical professional.'
                },
                patientFriendlySummary: {
                  type: Type.STRING,
                  description: 'A simplified summary for the patient, explaining the findings in easy-to-understand language.'
                }
              },
              required: ['riskLevel', 'safetyScore', 'scanFindings', 'summary', 'patientFriendlySummary']
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                    temperature: 0.1, // Lower temperature for more deterministic and accurate results
                    systemInstruction: "You are a world-class diagnostic AI assistant. Your analysis must be clinically accurate, precise, and consistent. All findings must be based strictly on the visual evidence within the provided medical scan."
                },
            });

            const resultData = JSON.parse(response.text);

            let heatmap: string | undefined = undefined;
            if (resultData.riskLevel === RiskLevel.CRITICAL || resultData.riskLevel === RiskLevel.HIGH) {
                heatmap = generateHeatmapUrl();
            }

            return {
                id: generateRandomId(),
                date: Date.now(),
                type: AnalysisType.SCAN,
                uploadedFile: { name: file.name, url: fileUrl, type: file.type },
                patientInfo: patientInfo,
                riskLevel: resultData.riskLevel,
                safetyScore: resultData.safetyScore,
                scanFindings: resultData.scanFindings,
                summary: resultData.summary,
                patientFriendlySummary: resultData.patientFriendlySummary,
                heatmapUrl: heatmap,
            };

        } catch (error) {
            console.error("Error analyzing scan with Gemini:", error);
            // Provide a fallback error response
            return {
                id: generateRandomId(),
                date: Date.now(),
                type: AnalysisType.SCAN,
                uploadedFile: { name: file.name, url: fileUrl, type: file.type },
                patientInfo: patientInfo,
                riskLevel: RiskLevel.MEDIUM,
                safetyScore: 50,
                scanFindings: [{ finding: 'Analysis Failed', location: 'N/A', severity: 'Mild' }],
                summary: 'The AI analysis could not be completed due to a technical error. Please try again or use a different file.',
                patientFriendlySummary: 'We\'re sorry, but there was an error analyzing your scan. Please try uploading it again.',
            };
        }
    }
};