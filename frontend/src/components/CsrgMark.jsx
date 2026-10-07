import React from 'react';
import { motion } from 'framer-motion';

export const SHIELD_PATH =
  'M22 2.5 4.5 9.2v13.4c0 10.2 7.4 17.9 17.5 22.9 10.1-5 17.5-12.7 17.5-22.9V9.2L22 2.5Z';

export const scanLine = {
  rest: { opacity: 0, y: 0 },
  hover: {
    opacity: [0, 0.9, 0],
    y: [0, 34, 34],
    transition: { duration: 1.1, ease: 'easeInOut' },
  },
};

export const CsrgMark = ({ className = '' }) => (
  <svg viewBox="0 0 44 48" fill="none" className={className} aria-hidden="true">
    <defs>
      <clipPath id="csrg-shield-clip-shared">
        <path d={SHIELD_PATH} />
      </clipPath>
      <linearGradient id="csrg-scan-shared" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
        <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
      </linearGradient>
    </defs>

    {/* Bidang perisai */}
    <path d={SHIELD_PATH} fill="currentColor" fillOpacity="0.08" />
    <path
      d={SHIELD_PATH}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />

    {/* Jalur sirkuit ke kiri dan kanan lubang kunci */}
    <g stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.45" strokeLinecap="round">
      <path d="M9 20h5l2.5-2.5" />
      <path d="M35 20h-5l-2.5-2.5" />
      <path d="M13 28h3.5" />
      <path d="M31 28h-3.5" />
    </g>
    <g fill="currentColor" fillOpacity="0.45">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="35" cy="20" r="1.4" />
      <circle cx="13" cy="28" r="1.2" />
      <circle cx="31" cy="28" r="1.2" />
    </g>

    {/* Lubang kunci */}
    <circle cx="22" cy="19.5" r="4.6" stroke="currentColor" strokeWidth="2.2" />
    <path
      d="M20.4 24.2h3.2l1.1 8.4a1 1 0 0 1-1 1.1h-3.4a1 1 0 0 1-1-1.1l1.1-8.4Z"
      fill="currentColor"
    />

    {/* Garis pindai siber, terpicu saat logo di-hover */}
    <g clipPath="url(#csrg-shield-clip-shared)">
      <motion.rect
        variants={scanLine}
        x="4"
        y="6"
        width="36"
        height="2.5"
        rx="1.25"
        fill="url(#csrg-scan-shared)"
      />
    </g>
  </svg>
);

export default CsrgMark;
