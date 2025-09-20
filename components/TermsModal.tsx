import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface TermsModalProps {
  onAccept: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ onAccept }) => {
  const [termsContent, setTermsContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-modal-backdrop backdrop-blur-sm animate-fade-in">
      <div className="bg-bg-secondary rounded-lg shadow-xl w-full max-w-2xl m-4 flex flex-col max-h-[90vh]">
        <header className="flex-shrink-0 p-4 border-b border-border-primary">
          <h2 className="text-xl font-bold text-text-primary">Terms and Conditions</h2>
        </header>
        <div className="flex-1 p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: termsContent }} />
          )}
        </div>
        <footer className="flex-shrink-0 flex justify-end gap-3 px-6 py-4 bg-bg-tertiary/50 rounded-b-lg">
          <button
            onClick={onAccept}
            disabled={isLoading || !!error}
            className="px-6 py-2 rounded-lg bg-bg-accent text-text-on-accent hover:bg-bg-accent-hover transition-colors font-medium disabled:bg-bg-accent-disabled"
          >
            Accept & Continue
          </button>
        </footer>
      </div>
    </div>
  );
};

export default TermsModal;