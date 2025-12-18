
const API_KEY = "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";

async function test() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": "https://trip-planner-alpha-flax.vercel.app",
        "X-Title": "Trip Planner",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemma-3-27b-it:free",
        "messages": [
          {
            "role": "user",
            "content": "Hello"
          }
        ]
      })
    });

    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Body:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
