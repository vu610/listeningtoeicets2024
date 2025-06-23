import React, { useState, useEffect } from 'react';
import './HelpGuide.css';

function HelpGuide() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleGuide = () => {
    setIsOpen(!isOpen);
  };
  
  // Xử lý phím tắt F1
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        toggleGuide();
      }
      
      // Đóng hướng dẫn khi nhấn Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, toggleGuide]);

  return (
    <div className="help-guide-container">
      <button 
        className={`help-button ${isOpen ? 'active' : ''}`} 
        onClick={toggleGuide}
        title="Hướng dẫn sử dụng (F1)"
      >
        <i className="fas fa-question-circle"></i>
        <span className="help-button-text">Hướng dẫn</span>
      </button>

      {isOpen && (
        <div className="help-guide-overlay">
          <div className="help-guide-content">
            <div className="help-guide-header">
              <h2>Hướng dẫn sử dụng</h2>
              <button className="close-button" onClick={toggleGuide}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="help-guide-body">
              <section className="help-section">
                <h3>Phím tắt</h3>
                <table className="shortcuts-table">
                  <thead>
                    <tr>
                      <th>Phím tắt</th>
                      <th>Chức năng</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><kbd>F1</kbd></td>
                      <td>Mở/đóng hướng dẫn</td>
                    </tr>
                    <tr>
                      <td><kbd>Space</kbd></td>
                      <td>Phát/Tạm dừng audio</td>
                    </tr>
                    <tr>
                      <td><kbd>Ctrl</kbd> + <kbd>Enter</kbd></td>
                      <td>Kiểm tra đáp án</td>
                    </tr>
                    <tr>
                      <td><kbd>Ctrl</kbd> + <kbd>R</kbd></td>
                      <td>Nghe lại</td>
                    </tr>
                    <tr>
                      <td><kbd>Alt</kbd> + <kbd>S</kbd></td>
                      <td>Phát chậm</td>
                    </tr>
                    <tr>
                      <td><kbd>Alt</kbd> + <kbd>A</kbd></td>
                      <td>Hiển thị đáp án</td>
                    </tr>
                    <tr>
                      <td><kbd>Alt</kbd> + <kbd>C</kbd></td>
                      <td>Bật/tắt tự động sửa</td>
                    </tr>
                    <tr>
                      <td><kbd>Alt</kbd> + <kbd>→</kbd></td>
                      <td>Câu tiếp theo</td>
                    </tr>
                    <tr>
                      <td><kbd>Alt</kbd> + <kbd>←</kbd></td>
                      <td>Câu trước</td>
                    </tr>
                    <tr>
                      <td><kbd>Esc</kbd></td>
                      <td>Đóng hướng dẫn</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section className="help-section">
                <h3>Cách sử dụng</h3>
                <ol className="usage-steps">
                  <li>
                    <strong>Chọn bài test:</strong> Chọn bài test và phần bạn muốn luyện tập từ menu.
                  </li>
                  <li>
                    <strong>Nghe audio:</strong> Nhấn nút "Phát" hoặc phím Space để nghe đoạn audio.
                  </li>
                  <li>
                    <strong>Nhập câu trả lời:</strong> Gõ những gì bạn nghe được vào ô nhập liệu.
                  </li>
                  <li>
                    <strong>Kiểm tra đáp án:</strong> Nhấn nút "Kiểm tra đáp án" hoặc Ctrl+Enter để kiểm tra câu trả lời của bạn.
                  </li>
                  <li>
                    <strong>Xem kết quả:</strong> Hệ thống sẽ hiển thị các từ đúng (màu xanh) và sai (màu đỏ).
                  </li>
                  <li>
                    <strong>Tự động sửa lỗi:</strong> Bật chế độ "Tự động sửa" để xem các từ đúng khi bạn nhập sai.
                  </li>
                  <li>
                    <strong>Tiếp tục:</strong> Nhấn "Tiếp theo" hoặc Alt+→ để chuyển sang câu tiếp theo.
                  </li>
                </ol>
              </section>

              <section className="help-section">
                <h3>Chế độ tự động sửa</h3>
                <p>
                  Khi bật chế độ tự động sửa, hệ thống sẽ hiển thị từ đúng bên cạnh từ sai bạn đã nhập sau khi kiểm tra đáp án.
                  Ví dụ: nếu bạn nhập "she eating" thay vì "she's eating", hệ thống sẽ hiển thị "she → she's".
                </p>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HelpGuide; 