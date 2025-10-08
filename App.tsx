import React, { useState, useEffect, useCallback } from 'react';
import { View, AnalysisResult } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import Upload, { LoadingSpinner } from './components/Upload';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import EmergencyAlert from './components/EmergencyAlert';
import ChatAssistant from './components/ChatAssistant';
import * as dbService from './services/dbService';

const App: React.FC = () => {
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For transient loading states like saving
  const [view, setView] = useState<View>('home');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] =useState<AnalysisResult[]>([]);
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      await dbService.initDB();
      const loadedHistory = await dbService.getAllReports();
      setHistory(loadedHistory.reverse());
      setIsDbInitialized(true);
    };
    initializeApp();
  }, []);


  useEffect(() => {
    if (!isDbInitialized || history.length === 0) {
      setShowEmergencyAlert(false);
      return;
    }
    // Show alert for the most recent critical result
    if (history[0].riskLevel === 'Critical') {
      setShowEmergencyAlert(true);
    } else {
      setShowEmergencyAlert(false);
    }
  }, [history, isDbInitialized]);

  const handleNavigation = (newView: View) => {
    if (newView === 'reports') {
        setAnalysisResult(null);
    }
    setView(newView);
  };
  
  const handleAnalysisComplete = useCallback(async (result: AnalysisResult) => {
    setIsLoading(true);
    await dbService.addReport(result);
    const newHistory = await dbService.getAllReports();
    setHistory(newHistory.reverse());
    setAnalysisResult(result);

    // After any analysis, navigate directly to the reports page
    // which will show the detail view for the new result.
    setView('reports');
    setIsLoading(false);
  }, []);

  const renderView = () => {
    if (!isDbInitialized) {
        // Render a loading state or nothing while DB initializes
        return (
            <div className="flex items-center justify-center h-full pt-20">
                <LoadingSpinner message="Initializing Application..." />
            </div>
        );
    }
    switch (view) {
      case 'home':
        return <Home onNavigate={handleNavigation} />;
      case 'upload':
        return <Upload onAnalysisComplete={handleAnalysisComplete} />;
      case 'dashboard':
        return <Dashboard history={history} onNavigate={handleNavigation} />;
      case 'reports':
        return <Reports reports={history} resultToShowInitially={analysisResult} />;
      default:
        return <Home onNavigate={handleNavigation} />;
    }
  };


  return (
    <div className="relative isolate flex flex-col min-h-screen bg-navy text-slate-300 font-sans">
       <div className="absolute inset-0 -z-10 h-full w-full bg-navy bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(45,212,191,0.2),rgba(255,255,255,0))]"></div>
      {showEmergencyAlert && <EmergencyAlert message={`Critical Finding Detected in Latest Report. Please Review Immediately.`} />}
      <Header currentView={view} onNavigate={handleNavigation} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
           <div className="flex items-center justify-center h-full pt-20">
                <LoadingSpinner message="Saving Report..." />
            </div>
        ) : renderView()}
      </main>
      <Footer />
      <ChatAssistant />
    </div>
  );
};

export default App;