const LEFT_PAGE = "M32 20 Q23 15 12 18 V46 Q23 43 32 48 Z";
const RIGHT_PAGE = "M32 20 Q41 15 52 18 V46 Q41 43 32 48 Z";

/** Open-book mark; the right page turns once on load and again on hover (CSS, off with reduced motion). */
export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="60" height="60" rx="14" fill="var(--estudisc-color-signal, #FFD43B)" stroke="currentColor" strokeWidth="4" />
      <g fill="#FFFCF5" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round">
        <path d={LEFT_PAGE} />
        <path d={RIGHT_PAGE} />
        <path className="brand-mark-page" d={RIGHT_PAGE} />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M17.5 26.5 Q22 25 27 27" />
        <path d="M17.5 33 Q22 31.5 27 33.5" />
      </g>
    </svg>
  );
}

/** Estudisc lockup: the open-book mark plus a live wordmark, so the name uses the product typeface. */
export function BrandLockup() {
  return (
    <span className="brand-lockup">
      <BrandMark />
      <span className="brand-word">Estudisc</span>
    </span>
  );
}
