import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, Medication, RiskLevel, AnalysisType } from '../types';
import { DownloadIcon, PrescriptionIcon, ScanIcon, ZoomInIcon, ZoomOutIcon, RefreshIcon, AlertTriangleIcon } from './icons/Icons';

interface ReportsProps {
  reports: AnalysisResult[];
  resultToShowInitially: AnalysisResult | null;
}

const MedicationStatusBadge: React.FC<{ status: Medication['status'] }> = ({ status }) => {
  const config = {
    'Verified': 'bg-green-900 text-green-300',
    'Interaction Warning': 'bg-yellow-900 text-yellow-300',
    'Incorrect Dosage': 'bg-red-900 text-red-300',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config[status]}`}>
      {status}
    </span>
  );
};

const RiskBadge: React.FC<{ level: RiskLevel }> = ({ level }) => {
    const config = {
        [RiskLevel.LOW]: 'bg-green-500/10 text-green-400',
        [RiskLevel.MEDIUM]: 'bg-yellow-500/10 text-yellow-400',
        [RiskLevel.HIGH]: 'bg-orange-500/10 text-orange-400',
        [RiskLevel.CRITICAL]: 'bg-red-500/10 text-red-400',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config[level]}`}>
            {level} Risk
        </span>
    );
};

const PrescriptionDetailView: React.FC<{ report: AnalysisResult; onBack: () => void }> = ({ report, onBack }) => {
    const [viewMode, setViewMode] = useState<'patient' | 'doctor'>('patient');

    const handleDownload = () => {
        if (window.confirm('Are you sure you want to download this report?')) {
            alert("PDF download functionality would be implemented here.");
        }
    }

    return (
       <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                     <button onClick={onBack} className="text-sm text-primary hover:underline mb-2">&larr; Back to All Reports</button>
                    <h2 className="text-3xl font-bold text-slate-200">Prescription Analysis Report</h2>
                    <p className="text-sm text-slate mt-1">Report ID: {report.id}</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="bg-lightest-navy p-1 rounded-full flex">
                        <button onClick={() => setViewMode('patient')} className={`px-3 py-1 text-sm font-semibold rounded-full ${viewMode === 'patient' ? 'bg-slate shadow' : 'text-light-slate'}`}>Patient View</button>
                        <button onClick={() => setViewMode('doctor')} className={`px-3 py-1 text-sm font-semibold rounded-full ${viewMode === 'doctor' ? 'bg-slate shadow' : 'text-light-slate'}`}>Doctor View</button>
                    </div>
                    <button onClick={handleDownload} className="flex items-center bg-primary hover:bg-primary-dark text-black font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow">
                        <DownloadIcon className="h-5 w-5 mr-2" />
                        Download PDF
                    </button>
                </div>
            </div>
            
            <div className="bg-light-navy rounded-xl shadow-lg p-8">
                <div className="mb-8">
                    <h3 className="text-xl font-semibold text-secondary mb-4">AI Summary</h3>
                    <div className="p-4 bg-lightest-navy/50 rounded-lg text-light-slate">
                        <p>{viewMode === 'patient' ? report.patientFriendlySummary : report.summary}</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-secondary mb-4">Medication Details</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-light-slate">
                            <thead className="text-xs text-light-slate uppercase bg-lightest-navy">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Medication</th>
                                    <th scope="col" className="px-6 py-3">Dosage</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                    <th scope="col" className="px-6 py-3">{viewMode === 'doctor' ? 'Technical Data' : 'Notes'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.medications?.map((med, index) => (
                                    <tr key={index} className="bg-light-navy border-b border-lightest-navy">
                                        <th scope="row" className="px-6 py-4 font-medium text-slate-200 whitespace-nowrap">{med.name}</th>
                                        <td className="px-6 py-4">{med.dosage}</td>
                                        <td className="px-6 py-4"><MedicationStatusBadge status={med.status}/></td>
                                        <td className="px-6 py-4">
                                            {viewMode === 'doctor' ? med.technicalNotes : (med.status === 'Interaction Warning' ? 'Please discuss this with your doctor.' : med.notes)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

const ScanDetailView: React.FC<{ report: AnalysisResult; onBack: () => void }> = ({ report, onBack }) => {
    const [viewMode, setViewMode] = useState<'patient' | 'doctor'>('patient');
    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });
    const imageContainerRef = useRef<HTMLDivElement>(null);

    const MIN_ZOOM = 1;
    const MAX_ZOOM = 8;
    const ZOOM_SENSITIVITY = 0.1;

    const handleReset = () => setTransform({ scale: 1, x: 0, y: 0 });

    const handleZoom = (direction: 'in' | 'out') => {
        setTransform(prev => {
            const newScale = direction === 'in' ? prev.scale * (1 + ZOOM_SENSITIVITY) : prev.scale * (1 - ZOOM_SENSITIVITY);
            const clampedScale = Math.max(MIN_ZOOM, Math.min(newScale, MAX_ZOOM));
            if (clampedScale <= MIN_ZOOM) return { scale: MIN_ZOOM, x: 0, y: 0 };
            return { ...prev, scale: clampedScale };
        });
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (!imageContainerRef.current) return;

        const rect = imageContainerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        setTransform(prev => {
            const delta = e.deltaY * -0.005;
            const newScale = prev.scale + delta * ZOOM_SENSITIVITY * prev.scale;
            const scale = Math.max(MIN_ZOOM, Math.min(newScale, MAX_ZOOM));
            
            if (scale === prev.scale) return prev;
            if (scale <= MIN_ZOOM) return { scale: MIN_ZOOM, x: 0, y: 0 };

            const x = mouseX - (mouseX - prev.x) * (scale / prev.scale);
            const y = mouseY - (mouseY - prev.y) * (scale / prev.scale);

            return { scale, x, y };
        });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsPanning(true);
        setStartPan({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isPanning) return;
        e.preventDefault();
        setTransform(prev => ({ ...prev, x: e.clientX - startPan.x, y: e.clientY - startPan.y }));
    };

    const handleMouseUpOrLeave = () => setIsPanning(false);

    const handleDownload = () => {
        if (window.confirm('Are you sure you want to download this report?')) {
            alert("PDF download functionality would be implemented here.");
        }
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <button onClick={onBack} className="text-sm text-primary hover:underline mb-2">&larr; Back to All Reports</button>
                    <h2 className="text-3xl font-bold text-slate-200">Scan Analysis Report</h2>
                    <p className="text-sm text-slate mt-1">Report ID: {report.id}</p>
                </div>
                 <div className="flex items-center space-x-4">
                    <div className="bg-lightest-navy p-1 rounded-full flex">
                        <button onClick={() => setViewMode('patient')} className={`px-3 py-1 text-sm font-semibold rounded-full ${viewMode === 'patient' ? 'bg-slate shadow' : 'text-light-slate'}`}>Patient View</button>
                        <button onClick={() => setViewMode('doctor')} className={`px-3 py-1 text-sm font-semibold rounded-full ${viewMode === 'doctor' ? 'bg-slate shadow' : 'text-light-slate'}`}>Doctor View</button>
                    </div>
                    <button onClick={handleDownload} className="flex items-center bg-primary hover:bg-primary-dark text-black font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow">
                        <DownloadIcon className="h-5 w-5 mr-2" />
                        Download PDF
                    </button>
                </div>
            </div>
            
            <div className="bg-light-navy rounded-xl shadow-lg p-8">
                {/* Scan Preview & Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-xl font-semibold text-secondary mb-4">Scan Preview</h3>
                        <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden group">
                           <div
                                ref={imageContainerRef}
                                className={`w-full h-full ${report.heatmapUrl ? 'cursor-grab' : ''} ${isPanning ? 'cursor-grabbing' : ''}`}
                                onWheel={report.heatmapUrl ? handleWheel : undefined}
                                onMouseDown={report.heatmapUrl ? handleMouseDown : undefined}
                                onMouseMove={report.heatmapUrl ? handleMouseMove : undefined}
                                onMouseUp={report.heatmapUrl ? handleMouseUpOrLeave : undefined}
                                onMouseLeave={report.heatmapUrl ? handleMouseUpOrLeave : undefined}
                            >
                                <img
                                    src={report.uploadedFile.url}
                                    alt="Scan"
                                    className="absolute inset-0 w-full h-full object-contain"
                                    style={report.heatmapUrl ? { 
                                        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, 
                                        transformOrigin: '0 0',
                                        transition: isPanning ? 'none' : 'transform 0.1s ease-out'
                                    } : {}}
                                />
                                {report.heatmapUrl && (
                                    <img
                                        src={report.heatmapUrl}
                                        alt="AI Heatmap"
                                        className="absolute inset-0 w-full h-full object-contain opacity-70 mix-blend-screen pointer-events-none"
                                        style={{ 
                                            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, 
                                            transformOrigin: '0 0',
                                            transition: isPanning ? 'none' : 'transform 0.1s ease-out'
                                        }}
                                    />
                                )}
                            </div>
                            {report.heatmapUrl && (
                                <div className="absolute bottom-4 right-4 bg-light-navy/70 backdrop-blur-sm rounded-lg p-1.5 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <button title="Zoom In" onClick={() => handleZoom('in')} className="p-1.5 hover:bg-lightest-navy rounded-md transition-colors">
                                        <ZoomInIcon className="h-5 w-5 text-slate-200" />
                                    </button>
                                    <button title="Zoom Out" onClick={() => handleZoom('out')} className="p-1.5 hover:bg-lightest-navy rounded-md transition-colors">
                                        <ZoomOutIcon className="h-5 w-5 text-slate-200" />
                                    </button>
                                    <button title="Reset View" onClick={handleReset} className="p-1.5 hover:bg-lightest-navy rounded-md transition-colors">
                                        <RefreshIcon className="h-5 w-5 text-slate-200" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-secondary mb-4">AI Summary</h3>
                        <div className="p-4 bg-lightest-navy/50 rounded-lg text-light-slate h-full">
                            <p>{viewMode === 'patient' ? report.patientFriendlySummary : report.summary}</p>
                        </div>
                    </div>
                </div>

                {/* Findings */}
                <div>
                    <h3 className="text-xl font-semibold text-secondary mb-4">Scan Findings</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-light-slate">
                            <thead className="text-xs text-light-slate uppercase bg-lightest-navy">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Finding</th>
                                    <th scope="col" className="px-6 py-3">Location</th>
                                    <th scope="col" className="px-6 py-3">Severity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.scanFindings?.map((finding, index) => (
                                    <tr key={index} className="bg-light-navy border-b border-lightest-navy">
                                        <th scope="row" className="px-6 py-4 font-medium text-slate-200 whitespace-nowrap">{finding.finding}</th>
                                        <td className="px-6 py-4">{finding.location}</td>
                                        <td className="px-6 py-4">{finding.severity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

const ReportsListView: React.FC<{ reports: AnalysisResult[]; onSelectReport: (report: AnalysisResult) => void }> = ({ reports, onSelectReport }) => {
    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold text-slate-200 mb-6">Report History</h2>
            {reports.length === 0 ? (
                 <div className="text-center py-16 bg-light-navy rounded-lg">
                    <p className="text-light-slate">No reports found.</p>
                    <p className="text-sm text-slate mt-2">Upload a document to get started.</p>
                </div>
            ) : (
                <div className="bg-light-navy rounded-xl shadow-lg">
                    <ul className="divide-y divide-lightest-navy">
                        {reports.map(report => (
                             <li key={report.id}>
                                <button onClick={() => onSelectReport(report)} className="w-full flex justify-between items-center p-6 text-left hover:bg-lightest-navy transition-colors duration-200">
                                    <div className="flex items-center">
                                        {report.type === AnalysisType.PRESCRIPTION 
                                            ? <PrescriptionIcon className="h-6 w-6 text-primary mr-4 flex-shrink-0"/> 
                                            : <ScanIcon className="h-6 w-6 text-secondary mr-4 flex-shrink-0"/>
                                        }
                                        <div>
                                            <p className="font-semibold text-lightest-slate">{report.uploadedFile.name}</p>
                                            <p className="text-sm text-slate mt-1">
                                                Analyzed on: {new Date(report.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <RiskBadge level={report.riskLevel} />
                                        <span className="text-slate">&rarr;</span>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


const Reports: React.FC<ReportsProps> = ({ reports, resultToShowInitially }) => {
  const [selectedReport, setSelectedReport] = useState<AnalysisResult | null>(resultToShowInitially);

  useEffect(() => {
    // This allows the view to change if a new analysis completes while on the reports page
    setSelectedReport(resultToShowInitially);
  }, [resultToShowInitially]);
  
  if (selectedReport) {
      if (selectedReport.type === AnalysisType.PRESCRIPTION) {
        return <PrescriptionDetailView report={selectedReport} onBack={() => setSelectedReport(null)} />
      } else { // It's a scan
        return <ScanDetailView report={selectedReport} onBack={() => setSelectedReport(null)} />
      }
  }

  return <ReportsListView reports={reports} onSelectReport={setSelectedReport} />
};

export default Reports;