"use strict";
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const browseBtn = document.getElementById("browseBtn");
const previewContainer = document.getElementById("previewContainer");

/*==========================================
                MeDeCode
==========================================*/

const languageButton = document.getElementById("languageButton");
const languageMenu = document.getElementById("languageMenu");
const languageSearch = document.getElementById("languageSearch");
const languageList = document.getElementById("languageList");
const selectedLanguage = document.getElementById("selectedLanguage");
const arrow = document.getElementById("arrow");
const seniorModeBtn = document.getElementById("seniorModeBtn");
const chatSection = document.getElementById("chatSection");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");
const treatmentContainer = document.getElementById("treatmentContainer");
const treatmentCards = document.getElementById("treatmentCards");
const progressFill = document.getElementById("progressFill");
const completedTasks = document.getElementById("completedTasks");
let treatmentPlan = null;
const progressText = document.getElementById("progressText");

// Append this implementation to the bottom of your script.js file

const micBtn = document.getElementById("micBtn");
const chatInputField = document.getElementById("chatInput");

let recognition = null;
let silenceTimer = null;
let isListening = false;

// Initialize Web Speech API if supported by the browser
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();

  // Set configurations
  recognition.continuous = true; // Keep listening even if the user pauses briefly
  recognition.interimResults = true; // Show results in real-time as the user speaks

  // Handle results streaming in
  recognition.onresult = (event) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    // Update the input field with what the user is saying
    if (finalTranscript || interimTranscript) {
      chatInputField.value = finalTranscript || interimTranscript;
    }

    // Clear any previous silence timeout timer because the user is actively speaking
    clearTimeout(silenceTimer);

    // Auto-send after 3.5 seconds of silence (3500ms)
    // Change 3500 to 30000 if you want a strict 30-second pause window instead
    silenceTimer = setTimeout(() => {
      if (chatInputField.value.trim() !== "") {
        stopVoiceListening();
        // Trigger your existing send button handler click
        const sendBtn = document.getElementById("sendChatBtn");
        if (sendBtn) sendBtn.click();
      }
    }, 3500);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    stopVoiceListening();
  };

  recognition.onend = () => {
    stopVoiceListening();
  };

  // Toggle listening state on mic button click
  micBtn.onclick = () => {
    if (isListening) {
      stopVoiceListening();
    } else {
      startVoiceListening();
    }
  };
} else {
  // Hide mic button if browser doesn't support speech tracking
  if (micBtn) micBtn.style.display = "none";
  console.log("Web Speech API is not supported in this browser.");
}

function startVoiceListening() {
  if (!recognition) return;

  // Dynamically pull the active system language code (e.g. "hi", "en", "te")
  // from your dropdown selection state
  let currentLangCode = "en-US";
  const dropdownLang = document
    .getElementById("languageList")
    ?.querySelector(".active")
    ?.getAttribute("data-lang");

  if (dropdownLang) {
    if (dropdownLang === "hi") currentLangCode = "hi-IN";
    else if (dropdownLang === "te") currentLangCode = "te-IN";
    else if (dropdownLang === "ta") currentLangCode = "ta-IN";
    else currentLangCode = dropdownLang;
  }

  recognition.lang = currentLangCode;

  try {
    recognition.start();
    isListening = true;
    micBtn.classList.add("listening");
    micBtn.innerHTML = "🛑";
    chatInputField.placeholder = "Listening... Speak now...";
  } catch (err) {
    console.error(err);
  }
}

function stopVoiceListening() {
  if (!recognition || !isListening) return;

  clearTimeout(silenceTimer);
  recognition.stop();
  isListening = false;
  micBtn.classList.remove("listening");
  micBtn.innerHTML = "🎙️";
  chatInputField.placeholder = "Ask about your report or past trends...";
}

const totalTasks = document.getElementById("totalTasks");
sendChatBtn.onclick = sendQuestion;
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendQuestion();
  }
});
const chatStatus = document.getElementById("chatStatus");

let currentReportContext = "";

document.addEventListener("DOMContentLoaded", () => {
  initializeNavbar();
  populateLanguageList();
  loadSavedLanguage();
  initializeSeniorMode();
  initializeUpload();
});

function initializeNavbar() {
  languageButton.addEventListener("click", toggleLanguageMenu);
  languageSearch.addEventListener("input", filterLanguages);
  languageMenu.addEventListener("click", (e) => e.stopPropagation());
  document.addEventListener("click", closeLanguageMenu);
}

function toggleLanguageMenu(e) {
  e.stopPropagation();
  const isOpen = languageMenu.style.display === "block";
  if (isOpen) {
    closeLanguageMenu();
    return;
  }
  languageSearch.value = "";
  displayLanguages(languages);
  languageMenu.style.display = "block";
  arrow.textContent = "▲";
  languageSearch.focus();
}

function closeLanguageMenu() {
  languageMenu.style.display = "none";
  arrow.textContent = "▼";
}

function populateLanguageList() {
  displayLanguages(languages);
}

function displayLanguages(list) {
  languageList.innerHTML = "";
  list.forEach((lang) => {
    const item = document.createElement("div");
    item.className = "language-item";
    item.textContent = lang.name;
    item.dataset.code = lang.code;
    item.addEventListener("click", () => {
      setLanguage(lang.code);
    });
    languageList.appendChild(item);
  });
}

function filterLanguages() {
  const value = languageSearch.value.toLowerCase().trim();
  const filtered = languages.filter((lang) => {
    return (
      lang.name.toLowerCase().includes(value) ||
      lang.code.toLowerCase().includes(value)
    );
  });
  displayLanguages(filtered);
}

function setLanguage(code) {
  const dictionary = translations[code];
  if (!dictionary) return;
  selectedLanguage.textContent = languages.find((l) => l.code === code).name;
  translatePage(code);
  localStorage.setItem("medeLanguage", code);
  closeLanguageMenu();
}

function loadSavedLanguage() {
  let lang = localStorage.getItem("medeLanguage");
  if (!lang) {
    lang = navigator.language.substring(0, 2);
    if (!translations[lang]) lang = "en";
  }
  setLanguage(lang);
}

function translatePage(code) {
  const dictionary = translations[code];
  if (!dictionary) return;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (dictionary[key]) {
      element.textContent = dictionary[key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    if (dictionary[key]) {
      element.placeholder = dictionary[key];
    }
  });

  document.documentElement.lang = code;
}

/*==========================================
            Senior Mode
==========================================*/

function initializeSeniorMode() {
  const enabled = localStorage.getItem("medeSeniorMode") === "true";

  if (enabled) {
    document.body.classList.add("senior");
    seniorModeBtn.classList.add("active");
  }

  seniorModeBtn.addEventListener("click", toggleSeniorMode);
}

function toggleSeniorMode() {
  document.body.classList.toggle("senior");
  seniorModeBtn.classList.toggle("active");

  const enabled = document.body.classList.contains("senior");

  localStorage.setItem("medeSeniorMode", enabled);

  if (enabled) {
    speak("Senior mode enabled");
  } else {
    window.speechSynthesis.cancel();
  }
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  const lang = localStorage.getItem("medeLanguage") || "en";

  switch (lang) {
    case "hi":
      utterance.lang = "hi-IN";
      break;

    case "te":
      utterance.lang = "te-IN";
      break;

    case "ta":
      utterance.lang = "ta-IN";
      break;

    case "kn":
      utterance.lang = "kn-IN";
      break;

    case "ml":
      utterance.lang = "ml-IN";
      break;

    case "mr":
      utterance.lang = "mr-IN";
      break;

    case "bn":
      utterance.lang = "bn-IN";
      break;

    case "gu":
      utterance.lang = "gu-IN";
      break;

    case "pa":
      utterance.lang = "pa-IN";
      break;

    case "ur":
      utterance.lang = "ur-PK";
      break;

    case "fr":
      utterance.lang = "fr-FR";
      break;

    case "de":
      utterance.lang = "de-DE";
      break;

    case "es":
      utterance.lang = "es-ES";
      break;

    case "pt":
      utterance.lang = "pt-PT";
      break;

    case "it":
      utterance.lang = "it-IT";
      break;

    case "ja":
      utterance.lang = "ja-JP";
      break;

    case "ko":
      utterance.lang = "ko-KR";
      break;

    case "zh":
      utterance.lang = "zh-CN";
      break;

    case "ar":
      utterance.lang = "ar-SA";
      break;

    default:
      utterance.lang = "en-US";
  }

  utterance.rate = 0.95;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

document.addEventListener("mouseover", (e) => {
  if (!document.body.classList.contains("senior")) return;

  const tag = e.target.tagName;

  if (["P", "SPAN", "BUTTON", "H1", "H2", "H3", "LI", "LABEL"].includes(tag)) {
    e.target.classList.add("zoomed-text");
  }
});

document.addEventListener("mouseout", (e) => {
  e.target.classList.remove("zoomed-text");
});
function initializeUpload() {
  browseBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length) {
      handleFile(e.target.files[0]);
    }
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");

    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
}
function handleFile(file) {
  const allowed = ["application/pdf", "image/png", "image/jpeg"];

  if (!allowed.includes(file.type)) {
    alert("Please upload a PDF, JPG or PNG file.");
    return;
  }

  showPreview(file);
}
function showPreview(file) {
  const uploadContent = document.getElementById("uploadContent");
  previewContainer.innerHTML = "";
  uploadContent.classList.add("hidden");
  previewContainer.classList.add("active");

  const title = document.createElement("h2");
  title.className = "preview-title";
  title.textContent = file.name;

  const info = document.createElement("p");
  info.className = "preview-info";
  info.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;

  previewContainer.appendChild(title);
  previewContainer.appendChild(info);

  const status = document.createElement("div");
  status.className = "upload-success";
  status.innerHTML = `
<div>✅ Upload Complete</div>
<small>Ready for AI Analysis</small>
`;

  previewContainer.appendChild(status);

  if (file.type.startsWith("image/")) {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.className = "big-preview";
    previewContainer.appendChild(img);
  } else if (file.type === "application/pdf") {
    const pdf = document.createElement("iframe");
    pdf.src = URL.createObjectURL(file);
    pdf.className = "big-preview";
    pdf.style.width = "100%";
    pdf.style.height = "650px";
    pdf.style.border = "none";
    previewContainer.appendChild(pdf);
  }

  const buttons = document.createElement("div");
  buttons.className = "preview-buttons";

  const analyze = document.createElement("button");
  analyze.className = "preview-btn";
  analyze.textContent = "🧠 Decode My Report";

  analyze.onclick = async () => {
    analyze.disabled = true;
    analyze.textContent = "⏳ Analyzing...";

    try {
      openChat();

      chatMessages.innerHTML = "";

      addMessage("📄 " + file.name + "\n\nUploaded successfully.", "user");

      showTyping();

      const animationPromise = playAnalysisAnimation();

      const result = await analyzeMedicalReport(file);

      await animationPromise;

      removeAnalysisAnimation();

      hideTyping();
      if (result.treatmentPlan) {
        displayTreatmentPlan(result.treatmentPlan);
      }
      reportData = result;
      console.log(reportData);

      // Save report data to localStorage history tracking array
      saveReportToHistory(result);

      displayAIAnalysis(result);
      currentReportContext = JSON.stringify(result);
    } catch (error) {
      console.error(error);

      hideTyping();

      addMessage("❌ " + error.message, "ai");
    }

    analyze.disabled = false;
    analyze.textContent = "🧠 Decode My Report";
  };

  buttons.appendChild(analyze);

  const change = document.createElement("button");
  change.className = "change-btn";
  change.textContent = "🔄 Change File";
  change.onclick = () => {
    previewContainer.innerHTML = "";
    previewContainer.classList.remove("active");
    uploadContent.classList.remove("hidden");
    fileInput.value = "";
  };
  buttons.appendChild(change);

  const remove = document.createElement("button");
  remove.className = "remove-btn";
  remove.textContent = "🗑 Remove";
  remove.onclick = () => {
    previewContainer.innerHTML = "";
    previewContainer.classList.remove("active");
    uploadContent.classList.remove("hidden");
    fileInput.value = "";
  };
  buttons.appendChild(remove);

  previewContainer.appendChild(buttons);
}

function addMessage(text, type) {
  document.getElementById("emptyChat")?.remove();

  const message = document.createElement("div");

  message.className = `message ${type}-message`;

  if (type === "ai") {
    message.innerHTML = `
<div class="ai-message-top">
<div class="chat-avatar">
<img src="Assets/AI.png" onerror="this.style.display='none'">
</div>
<div class="ai-name">
<b>MeDeCode AI</b>
<small>Just now</small>
</div>
</div>
<div class="message-body"></div>
`;

    message.querySelector(".message-body").innerText = text;

    const copy = document.createElement("button");
    const read = document.createElement("button");

    read.className = "read-btn";

    read.innerHTML = "🔊 Read";

    read.onclick = () => {
      speakText(text, read);
    };

    copy.className = "copy-btn";

    copy.innerHTML = "📋 Copy";

    copy.onclick = () => {
      navigator.clipboard.writeText(text);

      copy.innerHTML = "✅ Copied";

      setTimeout(() => {
        copy.innerHTML = "📋 Copy";
      }, 1500);
    };

    const actions = document.createElement("div");

    actions.className = "message-actions";

    actions.append(copy, read);

    message.appendChild(actions);
  } else {
    message.innerText = text;
  }

  chatMessages.appendChild(message);

  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,

    behavior: "smooth",
  });
}

function showTyping() {
  const typing = document.createElement("div");
  typing.className = "typing";
  typing.id = "typingIndicator";
  typing.innerHTML = "<span></span><span></span><span></span>";
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
  const typing = document.getElementById("typingIndicator");
  if (typing) typing.remove();
}

function openChat() {
  chatSection.classList.remove("hidden");
  chatSection.scrollIntoView({ behavior: "smooth" });
}
function displayAIAnalysis(data) {
  // 1. Check if the incoming data is a plain follow-up text string
  if (typeof data === "string") {
    addMessage(data, "ai");
    return;
  }

  // 2. If it's a structured object from a fresh upload, format it nicely
  let message = "";

  if (data.documentType) {
    message += "🩺 " + data.documentType + "\n\n";
  }

  if (data.summary) {
    message += "📋 SUMMARY\n";
    message += data.summary + "\n\n";
  }

  if (Array.isArray(data.criticalAlerts) && data.criticalAlerts.length) {
    message += "⚠ CRITICAL ALERTS\n";
    data.criticalAlerts.forEach((alert) => {
      if (typeof alert === "string") {
        message += "• " + alert + "\n";
      } else if (alert) {
        message += "• " + JSON.stringify(alert) + "\n";
      }
    });
    message += "\n";
  }

  if (Array.isArray(data.medicalTerms) && data.medicalTerms.length) {
    message += "📖 MEDICAL TERMS\n";
    data.medicalTerms.forEach((term) => {
      if (typeof term === "string") {
        message += "• " + term + "\n";
      } else if (term) {
        message += "• " + (term.term || term.name || "Medical Term") + "\n";
        if (term.meaning) {
          message += "  " + term.meaning + "\n";
        }
      }
    });
    message += "\n";
  }

  if (Array.isArray(data.medicines) && data.medicines.length) {
    message += "💊 MEDICINES\n";
    data.medicines.forEach((medicine) => {
      if (typeof medicine === "string") {
        message += "• " + medicine + "\n";
      } else if (medicine) {
        const name =
          medicine.name || medicine.medicine || medicine.drug || "Medicine";
        message += "• " + name;
        if (medicine.purpose) {
          message += " — " + medicine.purpose;
        }
        if (medicine.dosage) {
          message += " (" + medicine.dosage + ")";
        }
        message += "\n";
      }
    });
    message += "\n";
  }

  if (Array.isArray(data.dietSuggestions) && data.dietSuggestions.length) {
    message += "🍎 DIET SUGGESTIONS\n";
    data.dietSuggestions.forEach((item) => {
      if (typeof item === "string") {
        message += "• " + item + "\n";
      } else if (item) {
        message += "• " + JSON.stringify(item) + "\n";
      }
    });
    message += "\n";
  }

  if (Array.isArray(data.nextSteps) && data.nextSteps.length) {
    message += "📅 NEXT STEPS\n";
    data.nextSteps.forEach((step) => {
      if (typeof step === "string") {
        message += "• " + step + "\n";
      } else if (step) {
        message += "• " + JSON.stringify(step) + "\n";
      }
    });
    message += "\n";
  }

  if (
    Array.isArray(data.questionsForDoctor) &&
    data.questionsForDoctor.length
  ) {
    message += "❓ QUESTIONS FOR YOUR DOCTOR\n";
    data.questionsForDoctor.forEach((question) => {
      if (typeof question === "string") {
        message += "• " + question + "\n";
      } else if (question) {
        message += "• " + JSON.stringify(question) + "\n";
      }
    });
    message += "\n";
  }

  addMessage(message, "ai");
  document.getElementById("suggestedQuestions").classList.remove("hidden");

  if (data.treatmentPlan) {
    displayTreatmentPlan(data.treatmentPlan);
  }
}
function displayTreatmentPlan(plan) {
  treatmentPlan = plan;

  treatmentContainer.classList.remove("hidden");
  treatmentCards.innerHTML = "";

  const times = [
    ["morning", "🌅 Morning"],
    ["afternoon", "☀ Afternoon"],
    ["evening", "🌇 Evening"],
    ["night", "🌙 Night"],
  ];

  times.forEach(([key, title]) => {
    if (!plan[key] || !plan[key].length) return;

    const card = document.createElement("div");
    card.className = "timeCard";
    card.innerHTML = `<h3>${title}</h3>`;

    plan[key].forEach((item, index) => {
      const row = document.createElement("label");
      row.className = "task";

      // Fallback matching logic ensures keys map accurately 
      const name = item.medicine || item.title || item.name || "Unknown Medicine";
      const dosage = item.dosage || item.strength || "";
      const timing = item.timing || "";

      row.innerHTML = `
        <input
          type="checkbox"
          ${item.completed ? "checked" : ""}
          onchange="toggleTask('${key}',${index},this)">
        <div class="taskInfo ${item.completed ? "completed" : ""}">
          <b>${name}</b>
          <small>${dosage} ${timing ? '• ' + timing : ''}</small>
        </div>
      `;

      card.appendChild(row);
    });

    treatmentCards.appendChild(card);
  });

  if (plan.importantInstructions?.length) {
    const card = document.createElement("div");
    card.className = "timeCard";
    card.innerHTML = "<h3>⚠ Important Instructions</h3>";

    plan.importantInstructions.forEach((item, index) => {
      const instructionText = item.title || item.instruction || (typeof item === 'string' ? item : "Instruction");
      card.innerHTML += `
        <div class="task">
          <input
            type="checkbox"
            ${item.completed ? "checked" : ""}
            onchange="toggleInstruction(${index},this)">
          <div class="taskInfo ${item.completed ? "completed" : ""}">
            <b>${instructionText}</b>
          </div>
        </div>
      `;
    });

    treatmentCards.appendChild(card);
  }

  updateProgress();
}
function toggleTask(time, index, checkbox) {
  treatmentPlan[time][index].completed = checkbox.checked;

  localStorage.setItem(
    "treatmentPlan",

    JSON.stringify(treatmentPlan),
  );

  checkbox.nextElementSibling.classList.toggle(
    "completed",

    checkbox.checked,
  );

  updateProgress();
}
function toggleInstruction(index, checkbox) {
  treatmentPlan.importantInstructions[index].completed = checkbox.checked;

  localStorage.setItem(
    "treatmentPlan",

    JSON.stringify(treatmentPlan),
  );

  checkbox.nextElementSibling.classList.toggle(
    "completed",

    checkbox.checked,
  );

  updateProgress();
}
function updateProgress() {
  let total = 0;

  let done = 0;

  ["morning", "afternoon", "evening", "night"].forEach((time) => {
    (treatmentPlan[time] || []).forEach((task) => {
      total++;

      if (task.completed) done++;
    });
  });

  (treatmentPlan.importantInstructions || []).forEach((task) => {
    total++;

    if (task.completed) done++;
  });

  const percent = total ? (done / total) * 100 : 0;

  progressFill.style.width = percent + "%";

  progressText.innerHTML = done + " / " + total + " Completed";
}
let currentSpeech = null;

function speakText(text, button) {
  if (!("speechSynthesis" in window)) {
    alert("Text-to-Speech is not supported on this browser.");
    return;
  }

  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();

    if (currentSpeech === button) {
      button.innerHTML = "🔊 Read";
      currentSpeech = null;
      return;
    }
  }

  const clean = text
    .replace(/📋|📖|💊|⚠|🍎|📅|🩺|❓|•/g, " ")
    .replace(/\n/g, ". ")
    .replace(/\s+/g, " ")
    .trim();

  const utterance = new SpeechSynthesisUtterance(clean);

  const lang = localStorage.getItem("medeLanguage") || "en";

  const voices = speechSynthesis.getVoices();

  const voice = voices.find((v) => v.lang.toLowerCase().startsWith(lang));

  if (voice) utterance.voice = voice;

  utterance.lang = lang;

  utterance.rate = 0.95;
  utterance.pitch = 1;

  button.innerHTML = "⏹ Stop";

  currentSpeech = button;

  utterance.onend = () => {
    button.innerHTML = "🔊 Read";
    currentSpeech = null;
  };

  speechSynthesis.speak(utterance);
}

window.speechSynthesis.onvoiceschanged = () => {
  speechSynthesis.getVoices();
};
async function sendQuestion() {
  const question = chatInput.value.trim();

  if (!question) return;

  addMessage(question, "user");

  chatInput.value = "";

  showTyping();

  try {
    const lowerQuestion = question.toLowerCase();

    if (reportData) {
      if (
        lowerQuestion.includes("rbc") ||
        lowerQuestion.includes("hemoglobin") ||
        lowerQuestion.includes("cholesterol") ||
        lowerQuestion.includes("platelet") ||
        lowerQuestion.includes("wbc") ||
        lowerQuestion.includes("sugar") ||
        lowerQuestion.includes("creatinine")
      ) {
        // Let Gemini answer using reportContext
        // (We'll improve this in the next phase.)
      }
    }
    const answer = await askFollowUpQuestion(question);

    hideTyping();

    addMessage(answer, "ai");
  } catch (error) {
    hideTyping();

    addMessage("❌ " + error.message, "ai");
  }
}
document.querySelectorAll(".suggest-chip").forEach((button) => {
  button.onclick = () => {
    chatInput.value = button.innerText.replace(/[🍎💊🏃📅]/g, "").trim();

    sendQuestion();
  };
});
async function playAnalysisAnimation() {
  const loading = addLoadingMessage();

  const steps = [
    "📄 Reading your report...",

    "🩸 Detecting document type...",

    "💊 Identifying medicines...",

    "📖 Explaining medical terms...",

    "🌍 Translating into your selected language...",

    "🧠 Generating personalized summary...",
  ];

  for (const step of steps) {
    loading.innerHTML = step;

    await new Promise((resolve) => setTimeout(resolve, 700));
  }

  loading.parentElement.parentElement.remove();
}
function addLoadingMessage() {
  document.getElementById("emptyChat")?.remove();

  const wrapper = document.createElement("div");

  wrapper.className = "message ai-message";

  wrapper.innerHTML = `
<div class="ai-message-top">
<div class="chat-avatar">
<img src="Assets/AI.png" onerror="this.style.display='none'">
</div>
<div class="ai-name">
<b>MeDeCode AI</b>
<small>Analyzing...</small>
</div>
</div>

<div class="loading-text">
📄 Reading your report...
</div>
`;

  chatMessages.appendChild(wrapper);

  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: "smooth",
    a,
  });

  return wrapper.querySelector(".loading-text");
}
async function playAnalysisAnimation() {
  const steps = [
    "📄 Reading your medical report...",

    "🩺 Detecting document type...",

    "🧪 Understanding medical information...",

    "💊 Identifying medicines...",

    "📖 Explaining medical terms...",

    "🌍 Translating if needed...",

    "🧠 Simplifying for everyone...",

    "✨ Preparing your AI explanation...",
  ];

  const msg = document.createElement("div");

  msg.className = "message ai-message";

  msg.id = "analysisAnimation";

  chatMessages.appendChild(msg);

  chatMessages.scrollTop = chatMessages.scrollHeight;

  for (const step of steps) {
    msg.innerHTML += `
<div class="analysis-step">
${step}
</div>
`;

    chatMessages.scrollTop = chatMessages.scrollHeight;

    await new Promise((resolve) => setTimeout(resolve, 550));
  }
}
function removeAnalysisAnimation() {
  document.getElementById("analysisAnimation")?.remove();
}
document.getElementById("copyTreatmentBtn").onclick = () => {
  if (!treatmentPlan) return;

  let text = "🩺 Today's Treatment Plan\n\n";

  ["morning", "afternoon", "evening", "night"].forEach((time) => {
    if (!treatmentPlan[time]?.length) return;

    text += time.toUpperCase() + "\n";

    treatmentPlan[time].forEach((item) => {
      text += "• ";

      text += item.title || item.medicine;

      if (item.dosage) {
        text += " (" + item.dosage + ")";
      }

      if (item.timing) {
        text += " - " + item.timing;
      }

      text += "\n";
    });

    text += "\n";
  });

  if (treatmentPlan.importantInstructions?.length) {
    text += "IMPORTANT\n";

    treatmentPlan.importantInstructions.forEach((item) => {
      text += "• " + item.title + "\n";
    });
  }

  navigator.clipboard.writeText(text);

  alert("Treatment plan copied!");
};
document.getElementById("printTreatmentBtn").onclick = () => {
  const printWindow = window.open("", "_blank");

  printWindow.document.write(`
    <html>

    <head>

    <title>Treatment Plan</title>

    <style>

    body{

        font-family:Arial;

        padding:30px;

        line-height:1.8;

    }

    h1{

        color:#2563eb;

    }

    h2{

        margin-top:25px;

    }

    </style>

    </head>

    <body>

    <h1>🩺 Today's Treatment Plan</h1>
    `);

  ["morning", "afternoon", "evening", "night"].forEach((time) => {
    if (!treatmentPlan[time]?.length) return;

    printWindow.document.write(`<h2>${time.toUpperCase()}</h2><ul>`);

    treatmentPlan[time].forEach((item) => {
      printWindow.document.write(
        `<li>${item.title || item.medicine}
                ${item.dosage ? " - " + item.dosage : ""}
                ${item.timing ? " (" + item.timing + ")" : ""}
                </li>`,
      );
    });

    printWindow.document.write("</ul>");
  });

  if (treatmentPlan.importantInstructions?.length) {
    printWindow.document.write("<h2>Important Instructions</h2><ul>");

    treatmentPlan.importantInstructions.forEach((item) => {
      printWindow.document.write(`<li>${item.title}</li>`);
    });

    printWindow.document.write("</ul>");
  }

  printWindow.document.write("</body></html>");

  printWindow.document.close();

  printWindow.print();
};
function getLabResult(testName) {
  if (!reportData?.labResults) return null;

  return reportData.labResults.find((test) =>
    test.name.toLowerCase().includes(testName.toLowerCase()),
  );
}
function getMedicine(name) {
  if (!reportData?.medicines) return null;

  return reportData.medicines.find((med) =>
    med.name.toLowerCase().includes(name.toLowerCase()),
  );
}
function getDiagnosis() {
  return reportData?.diagnosis || [];
}
function findLabResult(query) {
  if (!reportData?.labResults) return null;

  query = query.toLowerCase();

  return reportData.labResults.find((test) =>
    test.name.toLowerCase().includes(query),
  );
}

function findMedicine(query) {
  if (!reportData?.medicines) return null;

  query = query.toLowerCase();

  return reportData.medicines.find((med) =>
    med.name.toLowerCase().includes(query),
  );
}

function findDiagnosis(query) {
  if (!reportData?.diagnosis) return null;

  query = query.toLowerCase();

  return reportData.diagnosis.find((item) =>
    item.toLowerCase().includes(query),
  );
}
function saveReportToHistory(newReport) {
  let history = JSON.parse(localStorage.getItem("medeReportHistory") || "[]");

  newReport.savedAt = new Date().toLocaleDateString();

  const isDuplicate = history.some(
    (report) =>
      report.reportTitle === newReport.reportTitle &&
      report.patientInformation?.name === newReport.patientInformation?.name &&
      JSON.stringify(report.labResults) ===
        JSON.stringify(newReport.labResults),
  );

  if (!isDuplicate) {
    history.push(newReport);
    localStorage.setItem("medeReportHistory", JSON.stringify(history));
  }
}
// Append this code block to the very bottom of your script.js file

/*=================================================================
            TRACKING HISTORY & ON-DEMAND GRAPHS CLOSURES
=================================================================*/

const clearHistoryBtn = document.getElementById("clearHistoryBtn");

if (clearHistoryBtn) {
  clearHistoryBtn.onclick = () => {
    // Confirm with the user before wiping out their data
    const confirmClear = confirm(
      "Are you sure you want to delete all saved medical report tracking records? This cannot be undone.",
    );

    if (confirmClear) {
      // Remove the history item from localStorage
      localStorage.removeItem("medeReportHistory");

      // Clear current app runtime reference state if needed
      const chatMessages = document.getElementById("chatMessages");
      if (chatMessages) {
        chatMessages.innerHTML = `
          <div class="message ai">
            🗑️ Historical medical data tracking has been cleared successfully. Your next uploaded reports will build a fresh history.
          </div>
        `;
      }

      alert("Medical history tracking cleared successfully.");
    }
  };
}

// Fixed: Moved outside clearHistoryBtn scope so it initializes properly on load
function checkForOnDemandChart(userQuestion) {
  const lowerQ = userQuestion.toLowerCase();

  // Only trigger if the user asks for a chart, trend, progress visual, or graph
  if (
    !lowerQ.includes("chart") &&
    !lowerQ.includes("graph") &&
    !lowerQ.includes("trend") &&
    !lowerQ.includes("visual")
  ) {
    return;
  }

  const history = JSON.parse(localStorage.getItem("medeReportHistory") || "[]");
  if (history.length < 2) return; // Needs historical points to build a timeline

  // Determine which biomarker the user wants to see based on keywords
  let targetBiomarker = "";
  if (lowerQ.includes("rbc") || lowerQ.includes("red blood"))
    targetBiomarker = "rbc";
  else if (lowerQ.includes("wbc") || lowerQ.includes("white blood"))
    targetBiomarker = "wbc";
  else if (lowerQ.includes("hemoglobin") || lowerQ.includes("hb"))
    targetBiomarker = "hemoglobin";
  else if (lowerQ.includes("platelet")) targetBiomarker = "platelet";
  else if (lowerQ.includes("iron") || lowerQ.includes("ferritin"))
    targetBiomarker = "iron";
  else if (
    lowerQ.includes("sugar") ||
    lowerQ.includes("glucose") ||
    lowerQ.includes("hba1c")
  )
    targetBiomarker = "glucose";
  else {
    // Default to the first out-of-range item if they just asked broadly for "my trend chart"
    const currentReport =
      typeof reportData !== "undefined"
        ? reportData
        : history[history.length - 1];
    if (currentReport && currentReport.labResults) {
      const problematicTest =
        currentReport.labResults.find(
          (t) => t.status === "Low" || t.status === "High",
        ) || currentReport.labResults[0];
      if (problematicTest) targetBiomarker = problematicTest.name.toLowerCase();
    }
  }

  if (!targetBiomarker) return;

  const trendDataPoints = [];
  let formalTestName = "";

  // Compile specific test metrics securely from local records
  history.forEach((report) => {
    if (report.labResults) {
      const matchingTest = report.labResults.find((t) =>
        t.name.toLowerCase().includes(targetBiomarker),
      );
      if (matchingTest && report.savedAt) {
        const numericVal = parseFloat(
          matchingTest.value || matchingTest.result,
        );
        if (!isNaN(numericVal)) {
          formalTestName = matchingTest.name;
          trendDataPoints.push({
            date: report.savedAt,
            value: numericVal,
            unit: matchingTest.unit || "",
          });
        }
      }
    }
  });

  // Inject chart into the active chat interface on match
  if (trendDataPoints.length > 1) {
    const chatMessages = document.getElementById("chatMessages");

    const chartWrapper = document.createElement("div");
    chartWrapper.className = "chart-trend-container";
    chartWrapper.style.marginTop = "10px";
    chartWrapper.style.padding = "12px";
    chartWrapper.style.background = "#f8fafc";
    chartWrapper.style.borderRadius = "12px";
    chartWrapper.style.border = "1px solid #e2e8f0";

    const chartTitle = document.createElement("h4");
    chartTitle.style.margin = "0 0 10px 0";
    chartTitle.style.color = "#1e293b";
    chartTitle.style.fontSize = "13px";
    chartTitle.textContent = `📊 Dynamic Requested Trend: ${formalTestName}`;
    chartWrapper.appendChild(chartTitle);

    const canvas = document.createElement("canvas");
    canvas.id = `chart_${Date.now()}`;
    chartWrapper.appendChild(canvas);

    // Append it directly as its own block in the chat window flow
    chatMessages.appendChild(chartWrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(() => {
      const ctx = canvas.getContext("2d");
      if (window.Chart) {
        new Chart(ctx, {
          type: "line",
          data: {
            labels: trendDataPoints.map((p) => p.date),
            datasets: [
              {
                label: `${formalTestName} (${trendDataPoints[0].unit || ""})`,
                data: trendDataPoints.map((p) => p.value),
                borderColor: "#10b981", // Uses a nice distinct emerald green for user requests
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                borderWidth: 2.5,
                tension: 0.2,
                fill: true,
                pointBackgroundColor: "#10b981",
                pointRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { grid: { color: "#f1f5f9" } },
              x: { grid: { display: false } },
            },
          },
        });
      } else {
        console.error("Chart.js library is not loaded on the window object.");
      }
    }, 50);
  }
}

// Fixed: Moved your chat submission wire outside the historical clean up scope
if (sendChatBtn) {
  sendChatBtn.onclick = async () => {
    const userQuestionText = chatInput.value.trim();
    if (!userQuestionText) return;

    addMessage(userQuestionText, "user");
    chatInput.value = "";
    showTyping();

    try {
      const aiResponseText = await askFollowUpQuestion(userQuestionText);
      hideTyping();
      displayAIAnalysis(aiResponseText);
      checkForOnDemandChart(userQuestionText);
    } catch (error) {
      console.error(error);
      hideTyping();
      addMessage("❌ Sorry, something went wrong.", "ai");
    }
  };
}
