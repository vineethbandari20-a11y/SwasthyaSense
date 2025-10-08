
import React from 'react';
import { AlertTriangleIcon } from './icons/Icons';

interface EmergencyAlertProps {
  message: string;
}

const EmergencyAlert: React.FC<EmergencyAlertProps> = ({ message }) => {
  return (
    <div className="w-full bg-red-600 text-black p-3 flex items-center justify-center text-center font-bold z-50 animate-fade-in">
      <AlertTriangleIcon className="h-6 w-6 mr-3 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};

export default EmergencyAlert;