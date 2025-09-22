import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import XIcon from './icons/XIcon';

interface TermsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose: () => void;
  showAcceptButton: boolean;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onAccept, onClose, showAcceptButton }) => {
  const [termsContent, setTermsContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchTerms = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/terms.html');
        if (!response.ok) {
          throw new Error('Failed to load terms and conditions.');
        }
        const html = await response.text();
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        setTermsContent(bodyMatch ? bodyMatch[1] : html);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTerms();
  }, [isOpen]);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-modal-backdrop backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 flex flex-col max-h-[90vh]">
        <header className="flex-shrink-0 p-6 flex items-center justify-between gap-4 border-b border-gray-200">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-gray-100">
                    <ShieldCheckIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Terms and Conditions</h1>
                  <p className="mt-1 text-sm text-gray-600">Please review our terms before continuing.</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <XIcon className="w-5 h-5 text-gray-500" />
            </button>
        </header>
        <div className="flex-1 p-8 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: termsContent }} />
          )}
        </div>
        <footer className="flex-shrink-0 p-4 flex flex-col sm:flex-row items-center justify-end gap-4 border-t border-gray-200 bg-gray-50">
          {showAcceptButton ? (
             <>
                <p className="text-sm text-gray-500 text-center sm:text-left mr-auto">
                    By continuing, you agree to the terms.
                </p>
                <button
                    onClick={onAccept}
                    disabled={isLoading || !!error}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-bg-accent text-text-on-accent hover:bg-bg-accent-hover transition-all font-semibold shadow-md disabled:bg-bg-accent-disabled"
                >
                    Accept & Continue
                </button>
             </>
          ) : (
            <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition-all font-semibold"
            >
                Close
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default TermsModal;