const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

type DailySecretOptions = {
  modeId: string;
  length: number;
  noRepeats?: boolean;
  date?: Date;
};

// Generator losowy

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Seed

function hashStringToSeed(value: string): number {
  let hash = 2166136261;

  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

// Data Daily

export function warsawDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// Kod Daily

export function generateDailySecret({
  modeId,
  length,
  noRepeats = false,
  date,
}: DailySecretOptions): string {
  const day = warsawDateKey(date);
  const seed = hashStringToSeed(`${day}|${modeId}|${length}`);
  const random = mulberry32(seed);

  if (noRepeats) {
    const digits = [...DIGITS];

    for (let i = digits.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [digits[i], digits[j]] = [digits[j], digits[i]];
    }

    return digits.slice(0, Math.min(length, DIGITS.length)).join("");
  }

  let code = "";

  for (let i = 0; i < length; i++) {
    code += String(Math.floor(random() * 10));
  }

  return code;
}
