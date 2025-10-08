import React from 'react';
import { View } from '../types';

interface HomeProps {
  onNavigate: (view: View) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="text-center py-16 md:py-24 animate-fade-in">
        <div 
            className="absolute inset-0 bg-grid-slate-700/[0.05] [mask-image:linear-gradient(0deg,transparent,black)]"
            style={{ zIndex: 0 }}
        ></div>
        <div className="relative z-10">
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-200 leading-tight mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-light to-secondary">
                    AI That Verifies,
                </span> Analyzes, and Protects.
            </h1>
            <p className="max-w-3xl mx-auto mt-4 text-lg md:text-xl text-light-slate">
                SwasthyaSense ensures safe prescriptions, accurate diagnostics, and easy-to-understand medical reports.
            </p>
            <div className="mt-10">
                <button 
                    onClick={() => onNavigate('upload')}
                    className="bg-primary hover:bg-primary-dark text-black font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/20"
                >
                    Get Started
                </button>
            </div>
        </div>
    </div>
  );
};

export default Home;