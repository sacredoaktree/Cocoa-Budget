import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export default function Card({ className = '', children }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm p-5 ${className}`}>
      {children}
    </div>
  );
}
