export function MuhdinLogo({
  className = "h-10 w-10",
}: {
  className?: string;
}) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-label="Logo MUHDIN" role="img">
      <defs>
        <linearGradient id="muhdin-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E7C86A" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
        <linearGradient id="muhdin-green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F7A50" />
          <stop offset="100%" stopColor="#0A4A30" />
        </linearGradient>
      </defs>
      {/* Hexagon frame */}
      <polygon
        points="32,3 57,17 57,47 32,61 7,47 7,17"
        fill="url(#muhdin-green)"
        stroke="url(#muhdin-gold)"
        strokeWidth="2.5"
      />
      <polygon
        points="32,8 53,19.5 53,44.5 32,56 11,44.5 11,19.5"
        fill="none"
        stroke="url(#muhdin-gold)"
        strokeWidth="0.8"
        opacity="0.6"
      />
      {/* Kaaba silhouette */}
      <rect x="23" y="26" width="18" height="20" rx="1.5" fill="#07271A" stroke="url(#muhdin-gold)" strokeWidth="1.2" />
      {/* Gold kiswa band */}
      <rect x="23" y="31.5" width="18" height="3.2" fill="url(#muhdin-gold)" />
      {/* Door */}
      <rect x="34.5" y="38" width="4.5" height="8" rx="0.8" fill="url(#muhdin-gold)" opacity="0.85" />
      {/* Star above */}
      <path
        d="M32 12 l1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z"
        fill="url(#muhdin-gold)"
      />
    </svg>
  );
}

export function MuhdinBrand({
  compact = false,
  light = false,
}: {
  compact?: boolean;
  light?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <MuhdinLogo className="h-9 w-9 shrink-0" />
      <div className="leading-none">
        <div className={`font-extrabold tracking-wide text-lg ${light ? "text-white" : "text-foreground"}`}>
          MUH
          <span className={light ? "text-gold-gradient" : "text-gold-deep dark:text-gold"}>DIN</span>
        </div>
        {!compact && (
          <div className={`text-[10px] font-medium mt-0.5 ${light ? "text-emerald-100/80" : "text-muted-foreground"}`}>
            Masyarakat Umroh Haji Digital Nusantara
          </div>
        )}
      </div>
    </div>
  );
}
