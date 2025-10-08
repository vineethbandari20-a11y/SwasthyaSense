
export type View = 'home' | 'upload' | 'dashboard' | 'reports';

// FIX: Add missing User type
export interface User {
    name: string;
    email: string;
    avatar: string;
}

export enum AnalysisType {
    PRESCRIPTION = 'prescription',
    SCAN = 'scan'
}

export enum RiskLevel {
    LOW = 'Low',
    MEDIUM = 'Medium',
    HIGH = 'High',
    CRITICAL = 'Critical'
}

export interface PatientInfo {
    name: string;
    id: string;
    dob: string;
}

export interface Medication {
    name: string;
    dosage: string;
    status: 'Verified' | 'Interaction Warning' | 'Incorrect Dosage';
    notes: string;
    technicalNotes?: string;
}

export interface ScanFinding {
    finding: string;
    location: string;
    severity: 'Mild' | 'Moderate' | 'Severe';
}

export interface AnalysisResult {
    id: string;
    date: number; // Timestamp
    type: AnalysisType;
    uploadedFile: {
        name: string;
        url: string;
        type: string;
    };
    patientInfo: PatientInfo;
    riskLevel: RiskLevel;
    safetyScore: number;
    medications?: Medication[];
    scanFindings?: ScanFinding[];
    summary: string; // The technical summary for doctors
    patientFriendlySummary: string; // The simplified summary for patients
    heatmapUrl?: string;
}