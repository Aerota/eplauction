// Server-only helper for calling Lovable AI Gateway.
export async function callLovableAI(body: {
  model: string;
  messages: { role: "system" | "user"; content: string }[];
  response_format?: { type: "json_object" };
}) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY is not set");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`AI Gateway ${res.status}: ${text.slice(0, 400)}`);
  }
  return JSON.parse(text) as {
    choices: { message: { content: string } }[];
  };
}
