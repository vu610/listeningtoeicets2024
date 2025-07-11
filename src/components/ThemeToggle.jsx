import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

function ThemeToggle() {
  const { theme, toggleTheme, isLightTheme } = useTheme();

  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme}
      title={isLightTheme ? "Chuyển sang chế độ tối" : "Chuyển sang chế độ sáng"}
    >
      {isLightTheme ? (
        <i className="fas fa-moon"></i>
      ) : (
        <i className="fas fa-sun"></i>
      )}
    </button>
  );
}

export default ThemeToggle; 