import React, { useRef } from 'react';
import useEscapeToClose from '../hooks/useEscapeToClose';
import useModalA11y from '../hooks/useModalA11y';

// Reusable in-app confirmation modal — pinapalitan ang native window.confirm(),
// na pwedeng ma-block o hindi gumana nang maayos sa ilang browsers (lalo na
// sa mobile), kaya parang "walang nangyayari" kapag pinindot ang isang button.
export default function ConfirmDialog({ confirmState, onCancel }) {
  useEscapeToClose(!!confirmState, onCancel);
  const dialogRef = useRef(null);
  useModalA11y(!!confirmState, dialogRef);

  if (!confirmState) return null;
  const { message, onConfirm, confirmLabel, danger } = confirmState;

  return (
    <div
      className="fixed inset-0 bg-[rgba(5,8,16,0.85)] backdrop-blur-md flex items-center justify-center z-[100001] p-4"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-label="Confirm action"
        className="bg-brand-card/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-[400px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] animate-[fadeInEffect_0.2s_ease-out] outline-none"
      >
        <p className="text-white text-sm leading-relaxed mb-5 whitespace-pre-line m-0">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-semibold cursor-pointer hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onCancel(); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-colors ${
              danger ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
