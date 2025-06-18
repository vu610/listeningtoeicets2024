import React from 'react';
import { useNavigate } from 'react-router-dom';
import { testNames } from '../data/testsIndex';
import './TestSelector.css';

function TestSelector({ partId, onSelectTest }) {
  const navigate = useNavigate();

  return (
    <div className="test-selector">
      <h3>Chọn đề luyện tập</h3>
      <div className="test-grid">
        {testNames.map((testName, index) => (
          <button 
            key={index} 
            className="test-btn" 
            onClick={() => onSelectTest(index)}
          >
            <i className="fas fa-file-alt"></i>
            <span>{testName}</span>
          </button>
        ))}
      </div>
      <div className="test-actions">
        <button 
          className="btn btn-outline" 
          onClick={() => navigate('/')}
        >
          <i className="fas fa-arrow-left"></i>
          Quay lại
        </button>
        <button 
          className="btn btn-primary" 
          onClick={() => onSelectTest(Math.floor(Math.random() * testNames.length))}
        >
          <i className="fas fa-random"></i>
          Chọn ngẫu nhiên
        </button>
      </div>
    </div>
  );
}

export default TestSelector; 