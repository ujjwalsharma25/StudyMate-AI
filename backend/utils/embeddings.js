/**
 * Generates text embeddings locally using Xenova/all-MiniLM-L6-v2 — a small,
 * free, open-source model that runs entirely on your machine (via
 * @xenova/transformers, a JS port of Hugging Face Transformers).
 *
 * No API key, no per-request cost, no external calls after the model is
 * cached. First run downloads the model (~90MB) — after that it's instant.
 *
 * Produces 384-dimensional vectors, which is why schema.sql defines
 * `embedding VECTOR(384)`.
 */

let extractorPromise = null;

function getExtractor() {
  if (!extractorPromise) {
    // Lazy import — keeps server startup fast when RAG isn't being used yet.
    extractorPromise = import("@xenova/transformers").then(({ pipeline }) =>
      pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2")
    );
  }
  return extractorPromise;
}

/**
 * Embeds a single string. Returns a plain JS array of 384 numbers.
 */
export async function embedText(text) {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

/**
 * Embeds many strings sequentially. Fine for the chunk counts a hackathon
 * demo will see (tens, not thousands) — no need for batching complexity.
 */
export async function embedBatch(texts) {
  const results = [];
  for (const text of texts) {
    results.push(await embedText(text));
  }
  return results;
}

/**
 * Converts a JS number array into the string format pgvector expects
 * for a VECTOR column: "[0.1,0.2,0.3,...]"
 */
export function toPgVector(embedding) {
  return "[" + embedding.join(",") + "]";
}
