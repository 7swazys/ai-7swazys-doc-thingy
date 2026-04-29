const logDiv = document.getElementById('log');
const apiKeyInput = document.getElementById('apiKey');
const promptInput = document.getElementById('prompt');
const generateBtn = document.getElementById('generate');

function addLog(msg, isError = false) {
  const div = document.createElement('div');
  div.style.padding = '4px 0';
  div.style.borderBottom = '1px solid #1a1a22';
  div.style.color = isError ? '#da373c' : '#a0a0b0';
  div.textContent = new Date().toLocaleTimeString() + ' - ' + msg;
  logDiv.appendChild(div);
  div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

generateBtn.onclick = async () => {
  const apiKey = apiKeyInput.value.trim();
  const prompt = promptInput.value.trim();
  if (!apiKey) { addLog('missing api key', true); return; }
  if (!prompt) { addLog('enter a prompt', true); return; }

  addLog('generating ai response...');
  
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      })
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    const aiText = data.choices[0].message.content;
    addLog(`ai: ${aiText.substring(0, 100)}...`);
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.url.includes('docs.google.com/document')) {
      addLog('open a google doc first', true);
      return;
    }
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (text) => {
        const el = document.activeElement;
        if (el && el.isContentEditable) {
          el.focus();
          document.execCommand('insertText', false, text + ' ');
        } else {
          const sel = window.getSelection();
          const range = sel.getRangeAt(0);
          range.insertNode(document.createTextNode(text + ' '));
          range.collapse(false);
        }
      },
      args: [aiText]
    });
    
    addLog('inserted into google doc');
    promptInput.value = '';
  } catch (err) {
    addLog(`error: ${err.message}`, true);
  }
};
