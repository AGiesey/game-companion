// The emblem above the app title on the sign-in screen: two rings, cross ticks and a vertical diamond.
// Outer pieces use the accent color, inner pieces the softer border-accent. Decorative only.
export function Emblem({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 112 112"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      className={`text-accent ${className}`}
    >
      <circle cx="56" cy="56" r="52" />
      <path d="M56 18v16M56 78v16M18 56h14M80 56h14" />
      <g className="text-border-accent">
        <circle cx="56" cy="56" r="40" />
        <path d="M44 56h4M64 56h4" />
      </g>
      <path d="M56 38l7 18-7 18-7-18z" strokeLinejoin="round" />
    </svg>
  )
}
