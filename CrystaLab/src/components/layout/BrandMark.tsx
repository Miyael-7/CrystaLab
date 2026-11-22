/** Isotipo de CrystaLab: celda cúbica en perspectiva con un plano de deslizamiento. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#111820" stroke="#233040" />
      <g fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round">
        <path d="M32 10 52 21v22L32 54 12 43V21z" />
        <path d="M12 21l20 11 20-11M32 32v22" opacity=".55" />
      </g>
      <path d="M14 42 50 22" stroke="var(--c-plane)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
