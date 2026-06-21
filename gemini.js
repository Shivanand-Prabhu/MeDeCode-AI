const MODEL = "gemini-2.5-flash";
let reportContext = "";
let reportData = null;

async function analyzeMedicalReport(file) {
  const language = getSelectedLanguageName();

  const prompt = `
You are MeDeCode AI.

You are an expert AI assistant specialized in understanding medical documents.

Your primary responsibility is ACCURACY.

Read the uploaded medical document carefully before generating any response.

------------------------------
DOCUMENT READING RULES
------------------------------

1. Read EVERY page completely.
2. Read every table, prescription, investigation, handwritten note, footer and header.
3. Never skip any medicine.
4. Never skip any dosage.
5. Never skip any laboratory result.
6. Never skip any diagnosis.
7. Never skip any doctor's instruction.
8. Never invent information.
9. If information is missing, clearly state it is unavailable.
10. Perform extraction FIRST.
11. Generate the explanation only AFTER extraction is complete.

------------------------------
LANGUAGE
------------------------------

Respond ONLY in ${language}.

Translate explanations only.

NEVER translate:

- Medicine names
- Drug brand names
- Generic medicine names
- Laboratory test names
- Hospital names
- Doctor names

Keep those exactly as written.

------------------------------
EXPLANATION STYLE
------------------------------

Explain everything so a 12-year-old can understand.

Do NOT diagnose diseases.

Do NOT replace professional medical advice.

Keep the summary below 120 words.

Mention emergency concerns ONLY if clearly supported by the report.

------------------------------
MEDICINE EXTRACTION
------------------------------

Extract EVERY medicine exactly as written.

For each medicine extract:

- name
- strength
- dosage
- frequency
- duration
- timing
- purpose
- specialInstructions

If timing exists:

After Breakfast → morning

Before Breakfast → morning

Empty Stomach → morning

After Lunch → afternoon

Before Lunch → afternoon

Evening → evening

After Dinner → night

Before Sleeping → night

If timing is not written,

write:

Estimated Timing

Never omit medicines.

Every medicine MUST appear exactly once inside treatmentPlan.

------------------------------
LAB RESULTS
------------------------------

Extract EVERY laboratory value.

Examples include but are not limited to:

RBC

WBC

Hemoglobin

Platelets

Blood Sugar

HbA1c

Creatinine

Urea

Sodium

Potassium

Cholesterol

HDL

LDL

Triglycerides

Liver Function Tests

Kidney Function Tests

Thyroid Tests

Vitamin Levels

Urine Tests

For EACH test return:

name

value

unit

referenceRange

status

Status must be exactly one of:

Normal

High

Low

Borderline

Unknown

------------------------------
RETURN JSON ONLY

{
"documentType":"",
"reportTitle":"",
"summary":"",
"criticalAlerts":[],

"patientInformation":{
"name":"",
"age":"",
"gender":"",
"patientId":""
},

"doctorInformation":{
"name":"",
"hospital":"",
"department":""
},

"diagnosis":[],

"vitals":[
{
"name":"",
"value":"",
"unit":""
}
],

"labResults":[
{
"name":"",
"value":"",
"unit":"",
"referenceRange":"",
"status":""
}
],

"medicalTerms":[
{
"term":"",
"meaning":""
}
],

"medicines":[
{
"name":"",
"strength":"",
"dosage":"",
"frequency":"",
"duration":"",
"timing":"",
"purpose":"",
"specialInstructions":""
}
],

"dietSuggestions":[],

"nextSteps":[],

"questionsForDoctor":[],

// ... Locate this inside the prompt variable within gemini.js ...

"treatmentPlan": {
  "morning": [
    {
      "medicine": "Medicine Name",
      "dosage": "Dosage/Strength",
      "timing": "Specific instruction (e.g., After Breakfast)"
    }
  ],
  "afternoon": [
    {
      "medicine": "Medicine Name",
      "dosage": "Dosage/Strength",
      "timing": "Specific instruction (e.g., After Lunch)"
    }
  ],
  "evening": [
    {
      "medicine": "Medicine Name",
      "dosage": "Dosage/Strength",
      "timing": "Specific instruction (e.g., Evening)"
    }
  ],
  "night": [
    {
      "medicine": "Medicine Name",
      "dosage": "Dosage/Strength",
      "timing": "Specific instruction (e.g., Before Sleeping)"
    }
  ],
  "importantInstructions": [
    {
      "title": "Instruction text details"
    }
  ]
}

------------------------------
FINAL VERIFICATION

Before returning your JSON verify:

✓ Every medicine has been extracted.

✓ Every medicine appears inside treatmentPlan.

✓ Every laboratory result has been extracted.

✓ Every diagnosis has been extracted.

✓ Every numerical value has been extracted.

✓ Every dosage has been extracted.

✓ Every doctor's instruction has been extracted.

✓ No information has been invented.

Return ONLY valid JSON.

Do NOT use markdown.

Do NOT wrap the JSON inside triple backticks.

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

    reportData = parsed;
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
  const lowerQuestion = question.toLowerCase();

  let relevantData = reportData;

  // Laboratory Questions
  if (
    lowerQuestion.includes("rbc") ||
    lowerQuestion.includes("wbc") ||
    lowerQuestion.includes("hemoglobin") ||
    lowerQuestion.includes("platelet") ||
    lowerQuestion.includes("cholesterol") ||
    lowerQuestion.includes("hdl") ||
    lowerQuestion.includes("ldl") ||
    lowerQuestion.includes("triglyceride") ||
    lowerQuestion.includes("creatinine") ||
    lowerQuestion.includes("glucose") ||
    lowerQuestion.includes("sugar") ||
    lowerQuestion.includes("hba1c") ||
    lowerQuestion.includes("vitamin") ||
    lowerQuestion.includes("calcium") ||
    lowerQuestion.includes("potassium") ||
    lowerQuestion.includes("sodium") ||
    lowerQuestion.includes("previous") ||
    lowerQuestion.includes("compared") ||
    lowerQuestion.includes("past") ||
    lowerQuestion.includes("improved")
  ) {
    relevantData = reportData?.labResults || [];
  }
  // Medicine Questions
  else if (
    lowerQuestion.includes("medicine") ||
    lowerQuestion.includes("tablet") ||
    lowerQuestion.includes("capsule") ||
    lowerQuestion.includes("drug") ||
    lowerQuestion.includes("dose") ||
    lowerQuestion.includes("dosage") ||
    lowerQuestion.includes("take") ||
    lowerQuestion.includes("pill")
  ) {
    relevantData = reportData?.medicines || [];
  }
  // Diagnosis
  else if (
    lowerQuestion.includes("diagnosis") ||
    lowerQuestion.includes("disease") ||
    lowerQuestion.includes("condition") ||
    lowerQuestion.includes("problem")
  ) {
    relevantData = reportData?.diagnosis || [];
  }
  // Diet
  else if (
    lowerQuestion.includes("diet") ||
    lowerQuestion.includes("eat") ||
    lowerQuestion.includes("food") ||
    lowerQuestion.includes("drink")
  ) {
    relevantData = reportData?.dietSuggestions || [];
  }
  // Doctor Advice
  else if (
    lowerQuestion.includes("doctor") ||
    lowerQuestion.includes("follow") ||
    lowerQuestion.includes("next") ||
    lowerQuestion.includes("instruction") ||
    lowerQuestion.includes("advice")
  ) {
    relevantData = reportData?.nextSteps || [];
  }

  // Retrieve storage history data
  const rawHistory = localStorage.getItem("medeReportHistory") || "[]";
  const historyData = JSON.parse(rawHistory);

  // Strip down historical entries to vital context elements only
  const simplifiedHistory = historyData.map((report) => ({
    savedAt: report.savedAt,
    documentType: report.documentType,
    reportTitle: report.reportTitle,
    labResults: report.labResults || [],
    diagnosis: report.diagnosis || [],
  }));

  const prompt = `
You are MeDeCode AI.
The user has uploaded a current medical report and is asking a question.

--------------------------------------------------
CURRENT REPORT DATA (Active Session)
--------------------------------------------------
${JSON.stringify(relevantData, null, 2)}

--------------------------------------------------
HISTORICAL MEDICAL RECORDS (Saved from Past Uploads)
--------------------------------------------------
Use this historical data to track trends, changes, and answer comparison questions (e.g., RBC count changes over time, improvements, etc.).
${JSON.stringify(simplifiedHistory, null, 2)}

User Question:
${question}

IMPORTANT RULES
- Answer ONLY in ${language}.
- Use ONLY the current data and historical records provided above.
- If the user asks about progress, trends, or comparisons (e.g., "how is my RBC compared to before?", "has anything improved?"), meticulously analyze values across timelines ('savedAt' fields) and explain what went up, down, or normalized.
- Never invent values or make assumptions. If information is missing, reply: "This information is not available in the uploaded report or history."
- Explain everything in very simple language.
- Keep your answer under 180 words.
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
            parts: [{ text: prompt }],
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
