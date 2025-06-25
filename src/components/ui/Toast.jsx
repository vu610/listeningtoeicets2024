import React, { useState, useEffect, useContext, createContext } from 'react';
import './Toast.css';

// Toast Context
const ToastContext = createContext();

// Toast Provider
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAllToasts }}>
      {children}
    </ToastContext.Provider>
  );
};

// Hook để sử dụng Toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { toasts, addToast, removeToast, clearAllToasts } = context;

  // Tạo các helper methods
  const success = (message, duration = 3000) => addToast(message, 'success', duration);
  const error = (message, duration = 5000) => addToast(message, 'error', duration);
  const warning = (message, duration = 4000) => addToast(message, 'warning', duration);
  const info = (message, duration = 3000) => addToast(message, 'info', duration);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info
  };
};

// Toast Component
export const Toast = ({ toast, onClose }) => {
  const { id, message, type } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        <span className="toast-message">{message}</span>
        <button className="toast-close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
};

// Toast Container Component
export const ToastContainer = ({ toasts, position = 'top-right' }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className={`toast-container toast-container-${position}`}>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={toast.onClose}
        />
      ))}
    </div>
  );
};

export default Toast;
