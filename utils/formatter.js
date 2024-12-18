function formatDavrLimit(number) {
  number = parseFloat(number) / 100 || 0;
  return number.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export {formatDavrLimit}