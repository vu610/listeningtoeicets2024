import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({
  value = 0,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = false,
  label = '',
  animated = false,
  striped = false,
  className = '',
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const classes = [
    'progress-bar-container',
    `progress-bar-${size}`,
    animated && 'progress-bar-animated',
    striped && 'progress-bar-striped',
    className
  ].filter(Boolean).join(' ');

  const barClasses = [
    'progress-bar',
    `progress-bar-${color}`,
    animated && 'progress-bar-fill-animated'
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {showLabel && (
        <div className="progress-label">
          <span>{label || `${Math.round(percentage)}%`}</span>
        </div>
      )}
      <div className="progress-track">
        <div 
          className={barClasses}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
