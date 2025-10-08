import React from 'react';
import { View } from '../types';
import { LogoIcon } from './icons/Icons';

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const NavLink: React.FC<{
  view: View;
  currentView: View;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ view, currentView, onClick, children }) => {
  const isActive = view === currentView;
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
        isActive
          ? 'bg-lightest-navy text-secondary'
          : 'text-light-slate hover:bg-light-navy hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
};


const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const navItems: { view: View; label: string }[] = [
    { view: 'home', label: 'Home' },
    { view: 'upload', label: 'Upload' },
    { view: 'dashboard', label: 'Dashboard' },
    { view: 'reports', label: 'Reports' },
  ];

  return (
    <header className="bg-navy/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm animate-fade-in">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button onClick={() => onNavigate('home')} className="flex items-center space-x-2 text-secondary">
              <LogoIcon className="h-8 w-8" />
              <span className="font-bold text-xl tracking-tight">SwasthyaSense</span>
            </button>
            <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                {navItems.map((item) => (
                    <NavLink key={item.view} view={item.view} currentView={currentView} onClick={() => onNavigate(item.view)}>
                    {item.label}
                    </NavLink>
                ))}
                </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;