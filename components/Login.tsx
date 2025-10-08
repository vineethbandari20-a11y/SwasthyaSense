import React, { useState } from 'react';
import { LogoIcon, GoogleIcon } from './icons/Icons';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const MOCK_USERS: User[] = [
  {
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    avatar: 'https://i.pravatar.cc/150?u=alex.johnson@example.com',
  },
  {
    name: 'Maria Garcia',
    email: 'maria.garcia@example.com',
    avatar: 'https://i.pravatar.cc/150?u=maria.garcia@example.com',
  },
  {
      name: 'Kenji Tanaka',
      email: 'kenji.tanaka@example.com',
      avatar: 'https://i.pravatar.cc/150?u=kenji.tanaka@example.com'
  }
];

const AccountSelectionModal: React.FC<{ onSelect: (user: User) => void; onClose: () => void }> = ({ onSelect, onClose }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
        <div className="bg-lightest-navy rounded-lg shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-light-navy">
                <h2 className="text-xl font-semibold text-slate-200">Choose an account</h2>
                <p className="text-sm text-slate mt-1">to continue to SwasthyaSense</p>
            </div>
            <ul className="p-2">
                {MOCK_USERS.map(user => (
                    <li key={user.email}>
                        <button onClick={() => onSelect(user)} className="w-full flex items-center p-3 rounded-lg hover:bg-light-navy transition-colors">
                            <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full" />
                            <div className="ml-4 text-left">
                                <p className="font-semibold text-slate-200">{user.name}</p>
                                <p className="text-sm text-slate">{user.email}</p>
                            </div>
                        </button>
                    </li>
                ))}
            </ul>
             <div className="p-4 text-center border-t border-light-navy">
                <p className="text-xs text-slate">This is a simulated login for demo purposes.</p>
            </div>
        </div>
    </div>
);


const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [showAccountSelector, setShowAccountSelector] = useState(false);

    const handleLoginSelect = (user: User) => {
        setShowAccountSelector(false);
        onLogin(user);
    };

  return (
    <>
    {showAccountSelector && <AccountSelectionModal onSelect={handleLoginSelect} onClose={() => setShowAccountSelector(false)} />}
    <div className="flex flex-col items-center justify-center min-h-screen bg-navy text-slate-300">
        <div className="absolute inset-0 -z-10 h-full w-full bg-navy bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(45,212,191,0.2),rgba(255,255,255,0))]"></div>
      <div className="text-center p-8 max-w-md w-full animate-fade-in">
        <div className="flex items-center justify-center space-x-3 mb-8">
          <LogoIcon className="h-12 w-12 text-secondary" />
          <span className="font-bold text-4xl tracking-tight text-slate-200">SwasthyaSense</span>
        </div>
        
        <div className="bg-light-navy p-8 rounded-2xl shadow-2xl">
          <h1 className="text-2xl font-semibold text-lightest-slate mb-2">Welcome Back</h1>
          <p className="text-slate mb-8">Sign in to access your secure health dashboard.</p>
          
          <div className="flex justify-center">
            <button
                onClick={() => setShowAccountSelector(true)}
                className="flex items-center justify-center w-full max-w-xs bg-white text-gray-700 font-semibold py-2 px-4 rounded-md shadow-sm hover:bg-gray-100 transition-colors"
            >
                <GoogleIcon className="h-6 w-6 mr-3" />
                Sign in with Google
            </button>
          </div>
        </div>

        <p className="text-xs text-slate mt-8">
          © 2025 SwasthyaSense – Empowering Safer Healthcare Through Intelligence.
        </p>
      </div>
    </div>
    </>
  );
};

export default Login;
