import { useState, useEffect } from 'react'
import { useIsPWA } from '../hooks/useUser'

export default function InstallBanner() {
  const isPWA = useIsPWA()
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    if (isPWA) return // Already installed
    
    const dismissed = localStorage.getItem('mwbl_install_dismissed')
    if (dismissed) return

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Show after 2 seconds
    const timer = setTimeout(() => setShow(true), 2000)
    return () => clearTimeout(timer)
  }, [isPWA])

  const dismiss = () => {
    localStorage.setItem('mwbl_install_dismissed', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="bg-primary-50 dark:bg-primary-900/30 border-b border-primary-100 dark:border-primary-800 px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="text-xl">📲</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary-800 dark:text-primary-200">
            Install for quick access
          </p>
          
          {isIOS ? (
            <>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-xs text-primary-600 dark:text-primary-400 underline"
              >
                {showHelp ? 'Hide' : 'Show me how'}
              </button>
              {showHelp && (
                <ol className="mt-2 text-xs text-primary-700 dark:text-primary-300 space-y-1.5 animate-slide-up">
                  <li>1. Tap <strong>Share</strong> ⬆️ at bottom of Safari</li>
                  <li>2. Scroll, tap <strong>Add to Home Screen</strong></li>
                  <li>3. Tap <strong>Add</strong></li>
                </ol>
              )}
            </>
          ) : (
            <p className="text-xs text-primary-600 dark:text-primary-400">
              Look for "Install" in your browser menu
            </p>
          )}
        </div>
        <button onClick={dismiss} className="text-primary-400 hover:text-primary-600 p-1">
          ✕
        </button>
      </div>
    </div>
  )
}
