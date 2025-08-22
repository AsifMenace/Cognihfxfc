export function parseMatchDateTime(match: { date: string; time?: string }) {
  if (match.date.includes("T")) {
    // Date string already includes time info
    return new Date(match.date);
  } else {
    // Separate date and time parts parsed into a local Date
    const [year, month, day] = match.date.split("-").map(Number);
    const [hour = 0, minute = 0, second = 0] = (match.time || "00:00:00")
      .split(":")
      .map(Number);

    return new Date(year, month - 1, day, hour, minute, second);
  }
}
