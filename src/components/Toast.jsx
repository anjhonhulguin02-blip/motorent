import React, { useEffect } from 'react';

// Reusable non-blocking notification — pinapalitan ang native alert() sa
// buong app. Auto-dismiss pagkatapos ng ilang segundo, pwede ring i-dismiss
// agad sa pag-click.
export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div
      onClick={onDismiss}
      className={`fixed bottom-6 right-6 left-6 sm:left-auto sm:max-w-[380px] z-[100000] px-5 py-4 rounded-xl border shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] backdrop-blur-xl cursor-pointer animate-[fadeInEffect_0.25s_ease-out] ${
        isError
          ? 'bg-red-500/15 border-red-500/40 text-red-300'
          : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-lg leading-none shrink-0">{isError ? '⚠️' : '✅'}</span>
        <p className="m-0 text-sm font-medium leading-relaxed">{toast.message}</p>
      </div>
    </div>
  );
}
