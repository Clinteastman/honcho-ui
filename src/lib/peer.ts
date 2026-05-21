/**
 * Helpers to classify peers as AI vs human, since Honcho's data model
 * doesn't natively distinguish them - it's purely a naming convention
 * (the claude-honcho plugin defaults to aiPeer="claude", cursor's plugin
 * uses "cursor", etc.).
 *
 * If you want a peer marked differently, set its metadata.kind in Honcho:
 *   PUT /peers/{peer_id}  body={ metadata: { kind: "ai" } }   // or "human"
 * That always wins over the heuristic.
 */

/** Names commonly used for AI peers by various agent harnesses. */
const AI_PEER_NAMES = new Set([
  "claude", "claude-code", "cursor", "gpt", "gpt-4", "gpt-5", "openai",
  "honcho", "assistant", "bot", "agent", "ai", "anthropic", "gemini",
  "llama", "qwen", "mistral",
]);

export type PeerKind = "ai" | "human";

export function classifyPeer(peer: { id?: string; metadata?: Record<string, unknown> }): PeerKind {
  const explicit = peer.metadata?.kind;
  if (explicit === "ai" || explicit === "human") return explicit;
  const id = (peer.id ?? "").toLowerCase();
  if (AI_PEER_NAMES.has(id)) return "ai";
  // Names ending with common AI suffixes
  if (/-(ai|bot|agent|gpt|llm)$/.test(id)) return "ai";
  return "human";
}
