/**
 * So sánh userInput và correctTranscript ở cấp ký tự.
 * Trả về mảng `{ char: string, status: 'correct' | 'incorrect' | 'missing' }`.
 * Không phân biệt chữ hoa/thường và bỏ qua dấu câu.
 */
export default function compareInput(userInput, correctTranscript) {
  // Chuẩn hóa chuỗi: chuyển về chữ thường và loại bỏ dấu câu
  const normalizeText = (text) => {
    if (!text) return '';
    // Chuyển về chữ thường
    let normalized = text.toLowerCase();
    // Loại bỏ dấu câu (.,!?;:'"()[]{}-_)
    normalized = normalized.replace(/[.,!?;:'"()\[\]{}\-_]/g, '');
    // Thay nhiều khoảng trắng liên tiếp bằng một khoảng trắng
    normalized = normalized.replace(/\s+/g, ' ');
    // Loại bỏ khoảng trắng ở đầu và cuối
    normalized = normalized.trim();
    return normalized;
  };

  // Chuẩn hóa đầu vào
  const normalizedUserInput = normalizeText(userInput);
  const normalizedTranscript = normalizeText(correctTranscript);

  // Tính toán độ chính xác (để trả về cho hàm gọi)
  const calculateAccuracy = () => {
    const words = normalizedTranscript.split(' ').filter(w => w.length > 0);
    const userWords = normalizedUserInput.split(' ').filter(w => w.length > 0);
    let correctWords = 0;

    // Đếm số từ đúng
    for (let i = 0; i < Math.min(words.length, userWords.length); i++) {
      if (words[i] === userWords[i]) {
        correctWords++;
      }
    }

    return {
      correctWords,
      totalWords: words.length,
      isComplete: correctWords === words.length && userWords.length === words.length
    };
  };

  // Tính độ chính xác để trả về
  const accuracy = calculateAccuracy();

  // Kết quả hiển thị vẫn giữ nguyên format gốc của correctTranscript
  const result = [];
  
  // Tạo mảng các ký tự từ chuỗi đầu vào
  const userChars = userInput ? userInput.split('') : [];
  
  // Chỉ hiển thị những gì người dùng đã nhập, không hiển thị đáp án
  for (let i = 0; i < userChars.length; i++) {
    const u = userChars[i];
    
    // Nếu vượt quá độ dài của câu đúng, coi như sai
    if (i >= correctTranscript.length) {
      result.push({ char: u, status: 'incorrect' });
      continue;
    }
    
    const c = correctTranscript[i];
    
    // So sánh không phân biệt hoa thường
    if (u.toLowerCase() === c.toLowerCase()) {
      result.push({ char: u, status: 'correct' });
    } else {
      // Kiểm tra xem ký tự hiện tại có phải là dấu câu không
      const isPunctuation = /[.,!?;:'"()\[\]{}\-_]/.test(c);
      
      // Nếu là dấu câu, vẫn hiển thị nhưng không tính là lỗi
      if (isPunctuation) {
        result.push({ char: u, status: 'correct' });
      } else {
        result.push({ char: u, status: 'incorrect' });
      }
    }
  }

  // Thêm thông tin về độ chính xác vào kết quả
  result.accuracy = accuracy;
  
  return result;
}
