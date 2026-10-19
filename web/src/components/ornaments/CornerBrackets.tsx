// Accent brackets on the four corners of a card, as on the sign-in card. Decorative only.
// Place inside a `relative` element; the brackets sit over its 1px border.
const corners = [
  '-top-px -left-px border-t-[3px] border-l-[3px]',
  '-top-px -right-px border-t-[3px] border-r-[3px]',
  '-bottom-px -left-px border-b-[3px] border-l-[3px]',
  '-bottom-px -right-px border-b-[3px] border-r-[3px]',
]

export function CornerBrackets() {
  return (
    <>
      {corners.map((position) => (
        <span key={position} aria-hidden="true" className={`pointer-events-none absolute size-9 border-accent ${position}`} />
      ))}
    </>
  )
}
