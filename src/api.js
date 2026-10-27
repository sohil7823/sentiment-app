// All calls go to the same site: /api/predict is the Python function on Vercel.
const URL = "/api/predict";

async function request(options) {
  let res;
  try {
    res = await fetch(URL, options);
  } catch {
    throw new Error("Could not reach the server. Check your internet connection.");
  }
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* non-JSON error page */
  }
  if (!res.ok) throw new Error(data.error || `Server error (${res.status}). Please try again.`);
  return data;
}

export const getHealth = () => request({ method: "GET" });

const post = (body) =>
  request({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const predictOne = (text) => post({ text });
export const predictBatch = async (texts) => (await post({ texts })).results;
