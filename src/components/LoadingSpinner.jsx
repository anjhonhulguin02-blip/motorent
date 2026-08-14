const DIM_CLASSES = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-14 h-14' };
const BORDER_CLASSES = { sm: 'border-2', md: 'border-2', lg: 'border-[3px]' };

// Shared premium loading indicator — a slim ring spinner plus an optional
// uppercase label, reused everywhere the app shows a loading state instead
// of every screen inventing its own "LOADING..." text.
export default function LoadingSpinner({ label, size = 'md' }) {
  const dims = DIM_CLASSES[size] || DIM_CLASSES.md;
  const border = BORDER_CLASSES[size] || BORDER_CLASSES.md;

  return (
    <div className="flex flex-col items-center justify-center gap-3.5">
      <div className={`relative ${dims}`}>
        <div className={`absolute inset-0 rounded-full ${border} border-brand-primary/15`}></div>
        <div className={`absolute inset-0 rounded-full ${border} border-transparent border-t-brand-primary animate-spin`}></div>
      </div>
      {label && (
        <span className="text-brand-muted text-[0.68rem] font-bold uppercase tracking-[0.2em] text-center">
          {label}
        </span>
      )}
    </div>
  );
}
