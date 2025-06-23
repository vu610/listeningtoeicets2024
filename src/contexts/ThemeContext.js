import React, { createContext, useState, useEffect, useContext } from 'react';

// Tạo context
export const ThemeContext = createContext();

// Hook để sử dụng context
export const useTheme = () => useContext(ThemeContext);

// Các theme có sẵn
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

// Khóa lưu trữ trong localStorage
const THEME_STORAGE_KEY = 'toeic_dictation_theme';

// Provider component
export const ThemeProvider = ({ children }) => {
  // Khởi tạo theme từ localStorage hoặc theo thiết lập hệ thống
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme && [THEMES.LIGHT, THEMES.DARK].includes(savedTheme)) {
      return savedTheme;
    }
    
    // Nếu không có theme đã lưu, kiểm tra thiết lập hệ thống
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return THEMES.DARK;
    }
    
    // Mặc định là theme sáng
    return THEMES.LIGHT;
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Cập nhật theme
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT));
  };

  // Lưu theme vào localStorage khi thay đổi
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    
    // Cập nhật class trên thẻ body
    document.body.className = theme;
  }, [theme]);

  // Giá trị context
  const value = {
    theme,
    toggleTheme,
    isLightTheme: theme === THEMES.LIGHT,
    isDarkTheme: theme === THEMES.DARK,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 