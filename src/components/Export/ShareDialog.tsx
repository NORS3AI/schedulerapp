import { useState } from 'react';
import { useSchedulerStore } from '../../store/useSchedulerStore';

interface ShareDialogProps {
  onClose: () => void;
}

export function ShareDialog({ onClose }: ShareDialogProps) {
  const { sessions, eventConfig } = useSchedulerStore();
  const [copied, setCopied] = useState(false);

  // Generate a shareable data string (base64 encoded)
  const generateShareData = () => {
    const data = {
      sessions: sessions.map((s) => ({
        id: s.id,
        presenterName: s.presenterName,
        sessionTitle: s.sessionTitle,
        duration: s.duration,
        day: s.day,
        timeSlot: s.timeSlot,
        roomId: s.roomId,
      })),
      eventConfig: {
        name: eventConfig.name,
        days: eventConfig.days,
        timeSlots: eventConfig.timeSlots,
        rooms: eventConfig.rooms,
      },
    };

    return btoa(JSON.stringify(data));
  };

  const shareUrl = `${window.location.origin}${window.location.pathname}#share=${generateShareData()}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Share Schedule</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Share this link to let others view your schedule. The schedule data is encoded in the URL.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm truncate"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Note: The URL may be long. Consider using a URL shortener for easier sharing.
          </p>
        </div>
      </div>
    </div>
  );
}
