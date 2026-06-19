const MODEL = "gemini-2.5-flash";
let reportContext = "";

async function analyzeMedicalReport(file) {
  const language = getSelectedLanguageName();

  const prompt = `
You are MeDeCode AI.

Your job is to explain medical documents in a way that an ordinary person can understand.

IMPORTANT RULES:

- Respond ONLY in ${language}.
- Never diagnose diseases.
- Never replace professional medical advice.
- Explain everything simply as if talking to a 12-year-old.
- Keep medical terms but explain them.
- Mention emergency concerns ONLY if they are clearly supported by the report.
- Never invent information.
- If something is missing, clearly say so.
- Keep the summary under 120 words.
- Do NOT wrap your response inside \`\`\`.
- Return ONLY valid JSON.

The JSON MUST ALWAYS follow this format:

{
"documentType":"",
"summary":"",
"criticalAlerts":[],
"medicalTerms":[
{
"term":"",
"meaning":""
}
],
"medicines":[],
"dietSuggestions":[],
"nextSteps":[],
"questionsForDoctor":[]
}
`;

  const base64 = await fileToBase64(file);

  const body = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
          {
            inline_data: {
              mime_type: file.type,
              data: base64,
            },
          },
        ],
      },
    ],
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini API Error");
  }

  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!raw) {
    throw new Error("Gemini returned an empty response.");
  }

  let cleaned = raw.trim();

  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json/, "").trim();
  }

  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```/, "").trim();
  }

  if (cleaned.endsWith("```")) {
    cleaned = cleaned.replace(/```$/, "").trim();
  }

  try {
    const parsed = JSON.parse(cleaned);

    reportContext = JSON.stringify(parsed);

    return parsed;
  } catch (error) {
    console.error(cleaned);
    throw new Error("Gemini returned invalid JSON.");
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result.split(",")[1];

      resolve(base64);
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

function getSelectedLanguageName() {
  const code = localStorage.getItem("medeLanguage") || "en";

  const map = {
    en: "English",
    hi: "Hindi",
    te: "Telugu",
    ta: "Tamil",
    kn: "Kannada",
    ml: "Malayalam",
    mr: "Marathi",
    bn: "Bengali",
    gu: "Gujarati",
    pa: "Punjabi",
    ur: "Urdu",
    fr: "French",
    de: "German",
    es: "Spanish",
    it: "Italian",
    pt: "Portuguese",
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese",
    ar: "Arabic",
  };

  return map[code] || "English";
}
async function askFollowUpQuestion(question) {
  const language = getSelectedLanguageName();

  const prompt = `
You are MeDeCode AI.

The user has already uploaded a medical report.

Here is the report analysis:

${reportContext}

User Question:

${question}

IMPORTANT:

- Answer ONLY in ${language}.
- Answer based ONLY on the uploaded report.
- If the report does not contain enough information, clearly say so.
- Keep your answer short, simple and reassuring.
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini Error");
  }

  return data.candidates[0].content.parts[0].text;
}
