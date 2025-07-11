import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary',
  className = '',
  text = '',
  ...props 
}) => {
  const classes = [
    'loading-spinner',
    `loading-spinner-${size}`,
    `loading-spinner-${color}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="loading-container" {...props}>
      <div className={classes}>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
