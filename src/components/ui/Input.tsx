import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({ 
  fullWidth = true,
  style,
  ...props 
}) => {
  const baseStyle: React.CSSProperties = {
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: '#1f2937',
    border: '2px solid #4b5563',
    color: 'white',
    fontSize: '1.25rem',
    outline: 'none',
    boxSizing: 'border-box',
    width: fullWidth ? '100%' : 'auto',
    ...style,
  };

  return (
    <input 
      style={baseStyle}
      {...props}
    />
  );
};

