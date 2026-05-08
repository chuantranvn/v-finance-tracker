"use client";

import React, { useId } from 'react';

export default function Logo({ className = "w-24 h-12" }: { className?: string }) {
  const id = useId();
  const gradientId = `logoGradient-${id.replace(/:/g, '')}`;
  
  return (
    <svg 
      viewBox="0 0 200 80" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B3D91" />
          <stop offset="50%" stopColor="#00796B" />
          <stop offset="100%" stopColor="#388E3C" />
        </linearGradient>
      </defs>
      
      {/* V Letter stylized */}
      <path 
        d="M20 35L45 75L65 40" 
        stroke={`url(#${gradientId})`}
        strokeWidth="14" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* F Letter stylized */}
      <path 
        d="M75 75V35H110M75 55H100" 
        stroke={`url(#${gradientId})`}
        strokeWidth="14" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* T Letter stylized */}
      <path 
        d="M125 35H170M147.5 35V75" 
        stroke={`url(#${gradientId})`}
        strokeWidth="14" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Candlesticks (Financial context) */}
      <rect x="2" y="45" width="3" height="20" rx="1" fill="#0B3D91" />
      <rect x="10" y="30" width="3" height="30" rx="1" fill="#0B3D91" />
      <rect x="18" y="40" width="3" height="15" rx="1" fill="#00796B" />

      {/* Upward Stock Trend Line */}
      <path 
        d="M30 70L60 55L90 70L120 45L150 65L185 30" 
        stroke="#43A047" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="drop-shadow-sm"
      />
      {/* Arrow Head */}
      <path 
        d="M175 30H185V40" 
        stroke="#43A047" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Fountain Pen Nib (Writing/Analysis context) - Pointing to T */}
      <g transform="translate(160, 5) rotate(35)">
        <path 
          d="M0 0C5 -5 10 0 10 15L5 30L0 15C0 0 5 -5 0 0Z" 
          fill="#1d1d1f" 
        />
        <path 
          d="M5 5V20" 
          stroke="white" 
          strokeWidth="1" 
          strokeLinecap="round" 
        />
        <circle cx="5" cy="20" r="1.5" fill="white" />
      </g>
    </svg>
  );
}
