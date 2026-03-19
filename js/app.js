// --- Global Variables ---
let currentMode = 'chat'; // Default mode chat rahega

// Theme Toggle Function
function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Check saved theme on load
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
}

// Mode Switcher (Image vs Chat)
function setMode(mode) {
    currentMode = mode;
    const inputField = document.getElementById("prompt");
    inputField.placeholder = mode === 'chat' ? "Ask KhanGPT anything..." : "Describe the image you want...";
    
    // UI feedback (Optional: Buttons ko highlight karne ke liye)
    showToast(`Switched to ${mode} mode`);
}

function setPrompt(text) {
    document.getElementById("prompt").value = text;
}

// Main Action Function
async function handleAction() {
    const promptInput = document.getElementById("prompt");
    const prompt = promptInput.value.trim();
    const resultDiv = document.getElementById("result");

    if (!prompt) {
        showToast("Please enter a prompt!");
        return;
    }

    // Clear previous results and show loading
    resultDiv.innerHTML = `<div class="loading-spinner">⚡ KhanGPT is ${currentMode === 'chat' ? 'typing' : 'painting'}...</div>`;
    promptInput.value = ""; // Input clear karein

    try {
        // Mode ke hisaab se sahi API call karein
        const apiUrl = currentMode === 'chat' ? "/api/chat" : "/api/generate-image";
        
        const res = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt })
        });

        const data = await res.json();

        if (data.error) {
            resultDiv.innerHTML = `<p style="color: #ff4444;">❌ Error: ${data.error}</p>`;
            return;
        }

        // Response Display karein
        if (currentMode === 'chat') {
            // Chat response ko format karke dikhayein
            resultDiv.innerHTML = `<div class="ai-msg">${data.text.replace(/\n/g, '<br>')}</div>`;
        } else {
            // Image response dikhayein
            resultDiv.innerHTML = `<img src="${data.url}" alt="AI Generated Image" onclick="window.open(this.src)">`;
        }

    } catch (error) {
        console.error("Fetch Error:", error);
        resultDiv.innerHTML = `<p style="color: #ff4444;">❌ Connection failed. Try again.</p>`;
    }
}

// Enter key se send karne ke liye
function handleKey(e) {
    if (e.key === 'Enter') {
        handleAction();
    }
}

// Simple Toast Notification
function showToast(msg) {
    console.log(msg); // Abhi ke liye console, aap CSS toast bhi bana sakte hain
}