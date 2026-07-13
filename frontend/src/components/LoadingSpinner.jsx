// ============================================================
// Loading Spinner Component
// ============================================================
const LoadingSpinner = ({ fullScreen = false, size = 'md' }) => {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-2',
    lg: 'w-16 h-16 border-4',
  }

  const spinner = (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`${sizes[size]} rounded-full border-brand-700 border-t-brand-400 animate-spin`}
      />
      {fullScreen && (
        <p className="text-slate-400 text-sm font-medium animate-pulse">Loading ColorVerse...</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-dark-900 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-6">
          <div className="text-4xl font-display font-black text-gradient animate-pulse">
            🎮 ColorVerse
          </div>
          {spinner}
        </div>
      </div>
    )
  }

  return spinner
}

export default LoadingSpinner
