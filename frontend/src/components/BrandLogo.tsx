type BrandLogoProps = {
  compact?: boolean;
};

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <div className={compact ? "brand brand-compact" : "brand"}>
      <svg viewBox="0 0 86 116" aria-hidden="true" className="brand-mark">
        <path d="M23 6 46 20 46 44 23 30Z" fill="#b90d2f" />
        <path d="M46 20 63 10 63 54 46 44Z" fill="#0b6a9e" />
        <path d="M23 30 46 44 46 67 23 53Z" fill="#f0b400" />
        <path d="M46 44 63 54 63 77 46 67Z" fill="#0b6a9e" />
        <path d="M23 53 46 67 46 90 23 76Z" fill="#f0b400" />
        <path d="M23 76 40 86 40 110 23 100Z" fill="#f0b400" />
        <path d="M40 86 57 76 57 100 40 110Z" fill="#0b6a9e" />
        <path d="M46 0 63 10 46 20 29 10Z" fill="#b90d2f" />
        <path d="M23 30 40 40 57 30 40 20Z" fill="#ffffff" opacity="0.92" />
        <path d="M23 53 40 63 57 53 40 43Z" fill="#b90d2f" />
      </svg>

      <div className="brand-wordmark">
        <div className="brand-title">FabLab</div>
        <div className="brand-divider">
          <span className="brand-divider-red" />
          <span className="brand-divider-yellow" />
          <span className="brand-divider-blue" />
        </div>
        <div className="brand-subtitle">UTFSM</div>
      </div>
    </div>
  );
}

