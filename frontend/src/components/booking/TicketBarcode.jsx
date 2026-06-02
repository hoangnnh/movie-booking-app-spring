const CODE_39_PATTERNS = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  A: "wnnnnwnnw",
  B: "nnwnnwnnw",
  C: "wnwnnwnnn",
  D: "nnnnwwnnw",
  E: "wnnnwwnnn",
  F: "nnwnwwnnn",
  G: "nnnnnwwnw",
  H: "wnnnnwwnn",
  I: "nnwnnwwnn",
  J: "nnnnwwwnn",
  K: "wnnnnnnww",
  L: "nnwnnnnww",
  M: "wnwnnnnwn",
  N: "nnnnwnnww",
  O: "wnnnwnnwn",
  P: "nnwnwnnwn",
  Q: "nnnnnnwww",
  R: "wnnnnnwwn",
  S: "nnwnnnwwn",
  T: "nnnnwnwwn",
  U: "wwnnnnnnw",
  V: "nwwnnnnnw",
  W: "wwwnnnnnn",
  X: "nwnnwnnnw",
  Y: "wwnnwnnnn",
  Z: "nwwnwnnnn",
  "-": "nwnnnnwnw",
  ".": "wwnnnnwnn",
  " ": "nwwnnnwnn",
  "*": "nwnnwnwnn",
};

const NARROW_WIDTH = 2;
const WIDE_WIDTH = 5;
const BAR_HEIGHT = 54;

function normalizeBarcodeValue(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^0-9A-Z.\- ]/g, "-");
}

function createBars(value) {
  const encodedValue = `*${normalizeBarcodeValue(value)}*`;
  const bars = [];
  let x = 0;

  encodedValue.split("").forEach((character) => {
    CODE_39_PATTERNS[character].split("").forEach((widthType, index) => {
      const width = widthType === "w" ? WIDE_WIDTH : NARROW_WIDTH;

      if (index % 2 === 0) {
        bars.push({ x, width });
      }

      x += width;
    });

    x += NARROW_WIDTH;
  });

  return { bars, width: x };
}

export default function TicketBarcode({ value, className = "" }) {
  const normalizedValue = normalizeBarcodeValue(value);
  const { bars, width } = createBars(normalizedValue);

  return (
    <div className={`rounded-tk-4 bg-white px-[12px] py-[10px] ${className}`}>
      <svg
        aria-label={`Barcode ${normalizedValue}`}
        className="h-[54px] w-full"
        role="img"
        viewBox={`0 0 ${width} ${BAR_HEIGHT}`}
        preserveAspectRatio="none"
      >
        {bars.map((bar, index) => (
          <rect
            key={`${bar.x}:${index}`}
            x={bar.x}
            y="0"
            width={bar.width}
            height={BAR_HEIGHT}
            fill="#111111"
          />
        ))}
      </svg>
      <p className="mt-[5px] break-all text-center text-[9px] tracking-[0.12em] text-neutral-900">
        {normalizedValue}
      </p>
    </div>
  );
}
