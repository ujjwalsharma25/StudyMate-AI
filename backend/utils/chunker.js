/**
 * Splits long text into overlapping word-based chunks. Overlap keeps a
 * sentence from being cut in half right at a chunk boundary — the ending
 * of one chunk repeats a little at the start of the next, so retrieval
 * doesn't miss context that straddles two chunks.
 */
export function chunkText(text, { chunkSize = 220, overlap = 40 } = {}) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];

  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const chunk = words.slice(start, end).join(" ").trim();
    if (chunk.length > 0) chunks.push(chunk);
    if (end === words.length) break;
    start = end - overlap;
  }

  return chunks;
}
