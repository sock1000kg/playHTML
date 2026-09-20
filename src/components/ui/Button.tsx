import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'default';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'default', 
  fullWidth = false,
  style, 
  disabled, 
  children, 
  ...props 
}) => {
  let baseStyle: React.CSSProperties = {
    padding: '1rem 2rem',
    borderRadius: '0.5rem',
    border: 'none',
    fontWeight: 'bold',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'background-color 0.2s',
    width: fullWidth ? '100%' : 'auto',
  };

  if (variant === 'primary') {
    baseStyle = {
      ...baseStyle,
      backgroundColor: disabled ? '#3b82f6' : '#2563eb',
      color: 'white',
    };
  } else if (variant === 'secondary') {
    baseStyle = {
      ...baseStyle,
      backgroundColor: '#4fc3f7',
      color: '#1a1a1a',
      padding: '15px',
    };
  } else {
    // Default / basic
    baseStyle = {
      ...baseStyle,
      padding: '10px',
      backgroundColor: '#333',
      color: 'white',
    };
  }

  return (
    <button 
      style={{ ...baseStyle, ...style }} 
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

