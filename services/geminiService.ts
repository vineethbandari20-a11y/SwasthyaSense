import { AnalysisResult, AnalysisType, PatientInfo, RiskLevel, Medication, ScanFinding } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize the Google GenAI client
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

const generateRandomId = () => Math.random().toString(36).substring(2, 9);

const generatePatientInfo = (userName: string): PatientInfo => ({
    name: userName, // Use the logged-in user's name
    id: `P${Math.floor(100000 + Math.random() * 900000)}`,
    dob: '1985-05-22',
});


const MOCK_PRESCRIPTION_MEDS_WARNING: Medication[] = [
    { 
        name: 'Lisinopril 10mg', 
        dosage: '1 tablet daily', 
        status: 'Verified', 
        notes: 'Standard dosage for hypertension.',
        technicalNotes: 'ACE inhibitor. Monitor renal function and potassium levels. Half-life: 12 hours.'
    },
    { 
        name: 'Metformin 500mg', 
        dosage: '2 tablets daily', 
        status: 'Verified', 
        notes: 'Standard dosage for Type 2 Diabetes.',
        technicalNotes: 'Biguanide class. Primarily excreted unchanged by the kidneys. Contraindicated in severe renal impairment (eGFR < 30).'
    },
    { 
        name: 'Ibuprofen 800mg', 
        dosage: 'As needed for pain', 
        status: 'Interaction Warning', 
        notes: 'Potential renal complications when combined with Lisinopril. Advise patient to use Acetaminophen instead.',
        technicalNotes: 'NSAID. Competes for renal tubular secretion with ACE inhibitors, potentially reducing antihypertensive effect and increasing risk of nephrotoxicity.'
    },
];

const MOCK_PRESCRIPTION_MEDS_CLEAN: Medication[] = [
    { 
        name: 'Lisinopril 10mg', 
        dosage: '1 tablet daily', 
        status: 'Verified', 
        notes: 'Standard dosage for hypertension.',
        technicalNotes: 'ACE inhibitor. Monitor renal function and potassium levels. Half-life: 12 hours.'
    },
    { 
        name: 'Metformin 500mg', 
        dosage: '2 tablets daily', 
        status: 'Verified', 
        notes: 'Standard dosage for Type 2 Diabetes.',
        technicalNotes: 'Biguanide class. Primarily excreted unchanged by the kidneys. Contraindicated in severe renal impairment (eGFR < 30).'
    },
    { 
        name: 'Atorvastatin 20mg', 
        dosage: '1 tablet daily', 
        status: 'Verified', 
        notes: 'Standard dosage for hypercholesterolemia.',
        technicalNotes: 'HMG-CoA reductase inhibitor. Metabolized by CYP3A4. Monitor liver function tests.'
    },
];

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

export const analyzeDocument = async (file: File, type: AnalysisType, userName: string): Promise<AnalysisResult> => {
    console.log(`Analyzing document for ${userName} - ${type}: ${file.name}`);
    
    const fileUrl = await fileToBase64(file);
    const patientInfo = generatePatientInfo(userName);

    if (type === AnalysisType.PRESCRIPTION) {
        // Keep prescription analysis mocked
        await new Promise(res => setTimeout(res, 1500));
        const lowerCaseFileName = file.name.toLowerCase();

        if (lowerCaseFileName.includes('interaction') || lowerCaseFileName.includes('warning')) {
             return {
                id: generateRandomId(),
                date: Date.now(),
                type: AnalysisType.PRESCRIPTION,
                uploadedFile: { name: file.name, url: fileUrl, type: file.type },
                patientInfo: patientInfo,
                riskLevel: RiskLevel.MEDIUM,
                safetyScore: 85,
                medications: MOCK_PRESCRIPTION_MEDS_WARNING,
                summary: "Prescription analysis complete. One potential drug interaction was detected between Ibuprofen and Lisinopril. All dosages appear correct based on patient records. Recommend alternative pain relief.",
                patientFriendlySummary: "We've reviewed your prescription. Everything looks safe, but we noticed that taking Ibuprofen with Lisinopril might not be ideal for you. It's a good idea to ask your doctor about using a different pain reliever, like Tylenol (Acetaminophen), just to be safe."
            };
        } else {
             return {
                id: generateRandomId(),
                date: Date.now(),
                type: AnalysisType.PRESCRIPTION,
                uploadedFile: { name: file.name, url: fileUrl, type: file.type },
                patientInfo: patientInfo,
                riskLevel: RiskLevel.LOW,
                safetyScore: 99,
                medications: MOCK_PRESCRIPTION_MEDS_CLEAN,
                summary: "Prescription analysis complete. All medications have been verified and no interactions were detected. Dosages are within standard guidelines.",
                patientFriendlySummary: "We've reviewed your prescription and everything looks great. The medications are safe to take together and the dosages are correct."
            };
        }
    } else { // It's a scan - USE GEMINI API
        try {
            const imagePart = await fileToGenerativePart(file);

            const textPart = {
                text: `You are a world-class radiologist AI assistant. Your purpose is to analyze medical scans with extreme precision and provide detailed, structured reports.
                Analyze this X-ray image. Identify any and all abnormalities, including but not limited to fractures, nodules, masses, inflammation, fluid, and foreign objects like kidney stones or gallstones if applicable to the scan type. Provide a detailed technical summary for a medical professional and a simplified, easy-to-understand summary for the patient. Assess the overall risk level and provide a safety score.
                The output must be a single, valid JSON object that strictly adheres to the provided schema. Do not include any markdown formatting like \`\`\`json.`,
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