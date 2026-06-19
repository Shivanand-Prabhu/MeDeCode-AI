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

      const result = await analyzeMedicalReport(file);

      hideTyping();

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
