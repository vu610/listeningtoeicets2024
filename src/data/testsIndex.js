import t1 from './t1.json';
import t2 from './t2.json';
import t3 from './t3.json';
import t4 from './t4.json';
import t5 from './t5.json';
import t6 from './t6.json';
import t7 from './t7.json';
import t8 from './t8.json';
import t9 from './t9.json';
import t10 from './t10.json';

const allTests = [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10];

export const testNames = [
  "Test 1", "Test 2", "Test 3", "Test 4", "Test 5", 
  "Test 6", "Test 7", "Test 8", "Test 9", "Test 10"
];

export const getTestByIndex = (index) => {
  if (index >= 0 && index < allTests.length) {
    return allTests[index];
  }
  return null;
};

export default allTests;
