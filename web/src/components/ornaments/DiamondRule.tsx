// A horizontal rule with a diamond in the middle, under the app title on the sign-in screen. Decorative only.
// The lines are borders so they stretch to any width without distorting the diamond.
export function DiamondRule({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`flex items-center gap-3 ${className}`}>
      <span className="flex-1 border-t border-border-accent" />
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} focusable="false" className="size-5 text-accent">
        <path d="M12 3l9 9-9 9-9-9z" strokeLinejoin="round" />
      </svg>
      <span className="flex-1 border-t border-border-accent" />
    </div>
  )
}
