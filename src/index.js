export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/" && request.method === "GET") {
      return Response.json(
        { status: "FRIDAY AI backend is running" },
        { headers: corsHeaders }
      );
    }

    if (url.pathname !== "/api/chat" || request.method !== "POST") {
      return Response.json(
        { error: "Not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    if (!env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: "Server API key is not configured" },
        { status: 500, headers: corsHeaders }
      );
    }

    try {
      const body = await request.json();
      const message = String(body.message || "").trim();

      if (!message) {
        return Response.json(
          { error: "Message is required" },
          { status: 400, headers: corsHeaders }
        );
      }

      const response = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 1000,
            messages: [
              { role: "user", content: message }
            ]
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return Response.json(
          { error: "Claude API request failed", details: data.error?.message },
          { status: 502, headers: corsHeaders }
        );
      }

      const reply = (data.content || [])
        .filter(item => item.type === "text")
        .map(item => item.text)
        .join("\n");

      return Response.json(
        { reply },
        { headers: corsHeaders }
      );
    } catch (error) {
      return Response.json(
        { error: "Server error. Please try again." },
        { status: 500, headers: corsHeaders }
      );
    }
  }
};
