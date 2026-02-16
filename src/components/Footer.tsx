import { Github } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-surface-800 px-6 py-3 flex items-center justify-center gap-6 text-xs text-surface-500">
      <a
        href="https://github.com/thomasklemm/cloudflare-browser-rendering-rest-api-playground"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 hover:text-accent-400 transition-colors"
      >
        <Github className="w-4 h-4" />
        <span>View on GitHub</span>
      </a>
      <span className="text-surface-700">•</span>
      <a
        href="https://developers.cloudflare.com/browser-rendering/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-accent-400 transition-colors"
      >
        Cloudflare Browser Rendering API
      </a>
    </footer>
  )
}
