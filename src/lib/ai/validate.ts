import { suggestionResponseSchema, type SuggestionResponse } from "./schema";

export type ValidationResult =
  | { success: true; data: SuggestionResponse }
  | { success: false; error: string };

/**
 * Pull a JSON object out of a model response that may be wrapped in markdown
 * fences or padded with prose, then validate it against the schema.
 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();

  // Strip ```json ... ``` or ``` ... ``` fences.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    // Fall back to the first balanced {...} block.
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new SyntaxError("No JSON object found in model output");
  }
}

export function validateSuggestionResponse(text: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = extractJson(text);
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Invalid JSON" };
  }

  const result = suggestionResponseSchema.safeParse(parsed);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues
        .slice(0, 5)
        .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
        .join("; "),
    };
  }
  return { success: true, data: result.data };
}
