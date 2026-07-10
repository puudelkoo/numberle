const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

// Walidacja długości

function validateLength(length: number) {
  if (!Number.isFinite(length) || length <= 0) {
    throw new Error("Length must be a positive number");
  }
}

// Kod z powtórzeniami

export function generateSecretCode(length: number): string {
  validateLength(length);

  let code = "";

  for (let i = 0; i < length; i++) {
    code += String(Math.floor(Math.random() * 10));
  }

  return code;
}

// Kod bez powtórzeń

export function generateSecretCodeNoRepeats(length: number): string {
  validateLength(length);

  if (length > DIGITS.length) {
    throw new Error("No-repeats mode supports max length 10");
  }

  const digits = [...DIGITS];

  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }

  return digits.slice(0, length).join("");
}
