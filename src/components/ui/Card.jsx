import React from 'react';
import './Card.css';

const Card = ({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'md',
  shadow = 'sm',
  hover = false,
  ...props 
}) => {
  const classes = [
    'card',
    `card-${variant}`,
    `card-padding-${padding}`,
    `card-shadow-${shadow}`,
    hover && 'card-hover',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`card-header ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardBody = ({ children, className = '', ...props }) => {
  return (
    <div className={`card-body ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`card-footer ${className}`} {...props}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
