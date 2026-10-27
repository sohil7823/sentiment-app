// Finds the airline from an @mention in the tweet (first airline mentioned wins).
const HANDLES = {
  united: "United",
  unitedairlines: "United",
  delta: "Delta",
  deltaassist: "Delta",
  americanair: "American",
  americanairlines: "American",
  southwestair: "Southwest",
  southwest: "Southwest",
  usairways: "US Airways",
  virginamerica: "Virgin America",
  jetblue: "JetBlue",
};

export function detectAirline(text) {
  for (const m of String(text).matchAll(/@(\w+)/g)) {
    const a = HANDLES[m[1].toLowerCase()];
    if (a) return a;
  }
  return null;
}
