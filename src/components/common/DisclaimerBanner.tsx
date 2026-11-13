import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-amber-500 text-amber-950 border-b border-amber-600/20 px-4 py-2 text-xs md:text-sm font-medium">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-950" />
          <span>
            <strong>Academic Demonstration Prototype:</strong> AwaazSetu assists citizens in drafting complaints and helps police officers review them. 
            This system <u>does not register an official legal FIR</u> and does not replace authorized police officers.
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 text-xs font-semibold bg-amber-600/30 px-2.5 py-1 rounded">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Emergency? Dial 112 directly</span>
        </div>
      </div>
    </div>
  );
};

