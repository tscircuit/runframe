"use client"
import { useEffect, useState } from "react"

interface CircuitLoaderProps {
  size?: number
  color?: string
  message?: string
}

export default function CircuitLoader({
  size = 200,
  color = "text-cyan-400",
  message = "Loading...",
}: CircuitLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-black space-y-4">
      {/* Circuit Animation */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 200 200"
          className={`w-full h-full animate-rotate-slow ${color}`}
        >
          <path
            d="M30 100 Q 100 30 170 100 Q 100 170 30 100"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            className="animate-dash"
            strokeDasharray="12 6"
          />
          <path
            d="M50 100 L80 60 L120 140 L150 100"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="12 6"
            className="animate-dash-reverse"
          />
          <circle
            cx="30"
            cy="100"
            r="4"
            fill="currentColor"
            className="animate-pulse"
          />
          <circle
            cx="170"
            cy="100"
            r="4"
            fill="currentColor"
            className="animate-pulse"
          />
        </svg>
      </div>

      {/* Loading Text */}
      <div className="text-center space-y-1">
        <h1 className={`${color} text-2xl font-bold tracking-widest`}>
          TS CIRCUITS
        </h1>
        <p className={`${color} text-sm font-medium tracking-wide opacity-75`}>
          {message}
        </p>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -100; }
        }
        @keyframes dash-reverse {
          to { stroke-dashoffset: 100; }
        }
        @keyframes rotate-slow {
          to { transform: rotate(360deg); }
        }
        .animate-dash {
          animation: dash 1.8s linear infinite;
        }
        .animate-dash-reverse {
          animation: dash-reverse 2.2s linear infinite;
        }
        .animate-rotate-slow {
          animation: rotate-slow 18s linear infinite;
        }
      `}</style>
    </div>
  )
}
