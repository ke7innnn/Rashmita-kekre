/**
 * Converts a numeric amount to Indian Currency Words format.
 * Examples:
 *   500       -> "Five Hundred Rupees Only"
 *   6500      -> "Six Thousand Five Hundred Rupees Only"
 *   21000     -> "Twenty One Thousand Rupees Only"
 *   150000    -> "One Lakh Fifty Thousand Rupees Only"
 *   1000000   -> "Ten Lakh Rupees Only"
 *   6500.50   -> "Six Thousand Five Hundred Rupees and Fifty Paise Only"
 */

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertLessThanThousand(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  const tenDigit = Math.floor(n / 10);
  const remainder = n % 10;
  return (tens[tenDigit] + (remainder > 0 ? ' ' + ones[remainder] : '')).trim();
}

function convertNumberToWords(n: number): string {
  if (n === 0) return 'Zero';

  let words = '';

  // Crore (1,00,00,000)
  const crore = Math.floor(n / 10000000);
  n %= 10000000;

  // Lakh (1,00,000)
  const lakh = Math.floor(n / 100000);
  n %= 100000;

  // Thousand (1,000)
  const thousand = Math.floor(n / 1000);
  n %= 1000;

  // Hundred (100)
  const hundred = Math.floor(n / 100);
  const remainder = n % 100;

  if (crore > 0) {
    words += convertNumberToWords(crore) + ' Crore ';
  }

  if (lakh > 0) {
    words += convertLessThanThousand(lakh) + ' Lakh ';
  }

  if (thousand > 0) {
    words += convertLessThanThousand(thousand) + ' Thousand ';
  }

  if (hundred > 0) {
    words += ones[hundred] + ' Hundred ';
  }

  if (remainder > 0) {
    words += convertLessThanThousand(remainder) + ' ';
  }

  return words.trim();
}

export function amountInWords(amount: number): string {
  const numericAmount = Math.abs(Number(amount) || 0);
  const rupees = Math.floor(numericAmount);
  const paise = Math.round((numericAmount - rupees) * 100);

  let result = '';

  if (rupees === 0 && paise === 0) {
    return 'Zero Rupees Only';
  }

  if (rupees > 0) {
    result += convertNumberToWords(rupees) + ' Rupees';
  }

  if (paise > 0) {
    if (rupees > 0) {
      result += ' and ';
    }
    result += convertLessThanThousand(paise) + ' Paise';
  }

  result += ' Only';
  return result;
}
