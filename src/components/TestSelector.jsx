import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { testNames } from '../data/testsIndex';
import './TestSelector.css';

function TestSelector({ partId, onSelectTest }) {
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log("TestSelector mounted - partId:", partId, "testNames:", testNames);
  }, [partId]);

  return (
    <div className="test-selector">
      <h3>Chọn đề luyện tập - Part {partId}</h3>
      <div className="test-grid">
        {testNames && testNames.length > 0 ? (
          testNames.map((testName, index) => (
            <button 
              key={index} 
              className="test-btn" 
              onClick={() => {
                console.log("Chọn đề:", index, testName);
                onSelectTest(index);
              }}
            >
              <i className="fas fa-file-alt"></i>
              <span>{testName}</span>
            </button>
          ))
        ) : (
          <div className="no-tests-message">
            Không có đề thi nào được tìm thấy.
          </div>
        )}
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
          onClick={() => {
            const randomIndex = Math.floor(Math.random() * testNames.length);
            console.log("Chọn đề ngẫu nhiên:", randomIndex);
            onSelectTest(randomIndex);
          }}
        >
          <i className="fas fa-random"></i>
          Chọn ngẫu nhiên
        </button>
      </div>
    </div>
  );
}

export default TestSelector; 