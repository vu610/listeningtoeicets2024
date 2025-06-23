/**
 * So sánh userInput và correctTranscript ở cấp độ từ.
 * Trả về mảng các từ với trạng thái `{ text: string, correctedText: string, status: 'correct' | 'incorrect' | 'missing' }`.
 * Không phân biệt chữ hoa/thường và bỏ qua dấu câu.
 */
export default function compareInput(userInput, correctTranscript) {
  // Chuẩn hóa chuỗi: chuyển về chữ thường và loại bỏ dấu câu
  const normalizeText = (text) => {
    if (!text) return '';
    // Chuyển về chữ thường
    let normalized = text.toLowerCase();
    // Loại bỏ dấu câu (.,!?;:'"()[]{}-_)
    normalized = normalized.replace(/[.,!?;:'"()[\]{}\-_]/g, '');
    // Thay nhiều khoảng trắng liên tiếp bằng một khoảng trắng
    normalized = normalized.replace(/\s+/g, ' ');
    // Loại bỏ khoảng trắng ở đầu và cuối
    normalized = normalized.trim();
    return normalized;
  };

  // Chuẩn hóa đầu vào
  const normalizedUserInput = normalizeText(userInput);
  const normalizedTranscript = normalizeText(correctTranscript);

  // Tách thành các từ
  const userWords = normalizedUserInput ? normalizedUserInput.split(' ').filter(w => w.length > 0) : [];
  const transcriptWords = normalizedTranscript ? normalizedTranscript.split(' ').filter(w => w.length > 0) : [];
  
  // Lấy các từ trong đáp án tương ứng với số lượng từ người dùng đã nhập
  // Chỉ kiểm tra đến từ cuối cùng người dùng đã nhập
  const relevantTranscriptWords = transcriptWords.slice(0, userWords.length);
  
  // Kết quả sẽ là mảng các từ với trạng thái
  const result = [];
  
  // So sánh từng từ người dùng nhập với từ tương ứng trong đáp án
  for (let i = 0; i < userWords.length; i++) {
    const userWord = userWords[i];
    const transcriptWord = i < relevantTranscriptWords.length ? relevantTranscriptWords[i] : null;
    
    if (!transcriptWord) {
      // Từ thừa (người dùng nhập nhiều hơn đáp án)
      result.push({
        text: userWord,
        correctedText: '',
        status: 'incorrect'
      });
      continue;
    }
    
    // So sánh từ người dùng với từ đáp án
    if (userWord.toLowerCase() === transcriptWord.toLowerCase()) {
      // Từ hoàn toàn đúng
      result.push({
        text: userWord,
        correctedText: transcriptWord,
        status: 'correct'
      });
    } else {
      // Từ sai, cần sửa
      // Tính độ tương đồng để xác định xem có nên sửa không
      const similarity = calculateSimilarity(userWord, transcriptWord);
      
      if (similarity > 0.5) { // Ngưỡng tương đồng
        // Từ gần đúng, cần sửa
        result.push({
          text: userWord,
          correctedText: transcriptWord,
          status: 'incorrect'
        });
      } else {
        // Từ hoàn toàn sai
        result.push({
          text: userWord,
          correctedText: transcriptWord,
          status: 'incorrect'
        });
      }
    }
  }
  
  // Tính toán độ chính xác
  const calculateAccuracy = () => {
    let correctWords = 0;
    let totalWords = transcriptWords.length;
    
    for (const item of result) {
      if (item.status === 'correct') {
        correctWords++;
      }
    }
    
    return {
      correctWords,
      totalWords,
      isComplete: correctWords === relevantTranscriptWords.length && 
                 userWords.length === transcriptWords.length
    };
  };
  
  // Tính độ chính xác để trả về
  const accuracy = calculateAccuracy();
  
  // Thêm thông tin về độ chính xác vào kết quả
  result.accuracy = accuracy;
  
  return result;
}

/**
 * Tính toán độ tương đồng giữa hai chuỗi (từ 0 đến 1)
 */
function calculateSimilarity(str1, str2) {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1; // Hai chuỗi rỗng được coi là giống nhau
  
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLength;
}

/**
 * Tính khoảng cách Levenshtein giữa hai chuỗi
 * (số thao tác thêm/xóa/thay thế ký tự tối thiểu để biến chuỗi này thành chuỗi kia)
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  
  // Tạo ma trận khoảng cách
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  
  // Khởi tạo giá trị ban đầu
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }
  
  // Tính toán khoảng cách
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // Xóa
        dp[i][j - 1] + 1, // Thêm
        dp[i - 1][j - 1] + cost // Thay thế hoặc giữ nguyên
      );
    }
  }
  
  return dp[m][n];
}
