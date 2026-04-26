/**
 * TroyBot - WhatsApp Session Generator
 * Web-based pairing code generator
 * Owner: Troy | +265894016453
 */

const express = require('express');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const pino = require('pino');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store active sessions in memory
const sessions = {};

// Clean a session folder
function cleanSession(id) {
  const folder = `./sessions/${id}`;
  if (fs.existsSync(folder)) {
    fs.rmSync(folder, { recursive: true, force: true });
  }
}

// Generate a unique session ID for each request
function makeId() {
  return Math.random().toString(36).substring(2, 10);
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>TroyBot - WhatsApp Linker</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #0a0a0a;
      color: #fff;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #111;
      border: 1px solid #222;
      border-radius: 16px;
      padding: 40px 32px;
      width: 100%;
      max-width: 460px;
      text-align: center;
      box-shadow: 0 0 40px rgba(37,211,102,0.08);
    }
    .logo {
      font-size: 48px;
      margin-bottom: 10px;
    }
    h1 {
      font-size: 26px;
      font-weight: 700;
      color: #25d366;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 13px;
      color: #666;
      margin-bottom: 30px;
    }
    .tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      background: #1a1a1a;
      padding: 4px;
      border-radius: 10px;
    }
    .tab {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      background: transparent;
      color: #666;
      transition: all 0.2s;
    }
    .tab.active {
      background: #25d366;
      color: #000;
    }
    input {
      width: 100%;
      padding: 14px 16px;
      border-radius: 10px;
      border: 1px solid #333;
      background: #1a1a1a;
      color: #fff;
      font-size: 15px;
      margin-bottom: 14px;
      outline: none;
      transition: border 0.2s;
    }
    input:focus { border-color: #25d366; }
    input::placeholder { color: #555; }
    button.submit {
      width: 100%;
      padding: 14px;
      background: #25d366;
      color: #000;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    button.submit:hover { opacity: 0.85; }
    button.submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .result-box {
      display: none;
      margin-top: 24px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 10px;
      padding: 16px;
      text-align: left;
    }
    .result-box.visible { display: block; }
    .pair-code {
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 6px;
      color: #25d366;
      text-align: center;
      margin: 10px 0;
      font-family: monospace;
    }
    .session-string {
      font-size: 11px;
      word-break: break-all;
      color: #aaa;
      background: #0d0d0d;
      padding: 10px;
      border-radius: 8px;
      margin-top: 10px;
      font-family: monospace;
      max-height: 80px;
      overflow-y: auto;
    }
    .copy-btn {
      width: 100%;
      margin-top: 10px;
      padding: 10px;
      background: #1e3a2a;
      color: #25d366;
      border: 1px solid #25d366;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .copy-btn:hover { background: #25d366; color: #000; }
    .steps {
      font-size: 12px;
      color: #888;
      text-align: left;
      margin-top: 14px;
      line-height: 1.9;
    }
    .steps span { color: #25d366; font-weight: 600; }
    .status {
      font-size: 13px;
      margin-top: 12px;
      color: #ffcc00;
    }
    .status.success { color: #25d366; }
    .status.error { color: #ff4444; }
    footer {
      margin-top: 24px;
      font-size: 12px;
      color: #444;
    }
    .spinner {
      display: inline-block;
      width: 16px; height: 16px;
      border: 2px solid #333;
      border-top-color: #25d366;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      vertical-align: middle;
      margin-right: 6px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🤖</div>
    <h1>TroyBot</h1>
    <p class="subtitle">WhatsApp Session Generator</p>

    <div class="tabs">
      <button class="tab active" onclick="switchTab('pair')">📱 Pair Code</button>
    </div>

    <!-- PAIR CODE TAB -->
    <div id="tab-pair">
      <input type="tel" id="phoneInput" placeholder="Enter number e.g. 265894016453" />
      <button class="submit" id="pairBtn" onclick="getPairCode()">🔑 Get Pairing Code</button>

      <div class="result-box" id="pairResult">
        <div id="pairStatus" class="status"></div>
        <div class="pair-code" id="pairCode"></div>
        <div class="steps" id="pairSteps" style="display:none">
          <span>Steps to link:</span><br/>
          1. Open WhatsApp on your phone<br/>
          2. Go to <span>Settings → Linked Devices</span><br/>
          3. Tap <span>"Link a Device"</span><br/>
          4. Tap <span>"Link with phone number instead"</span><br/>
          5. Enter the code above<br/><br/>
          <span>⏳ Waiting for you to link...</span>
        </div>
        <div id="sessionSection" style="display:none">
          <div style="color:#25d366;font-weight:700;margin-bottom:6px">✅ Session Generated!</div>
          <div style="font-size:12px;color:#888;margin-bottom:6px">Copy this and paste into config.js as sessionID:</div>
          <div class="session-string" id="sessionString"></div>
          <button class="copy-btn" onclick="copySession()">📋 Copy Session ID</button>
        </div>
      </div>
    </div>
  </div>

  <footer>© 2025 Troy | TroyBot</footer>

  <script>
    let pollInterval = null;
    let currentSid = null;

    function switchTab(tab) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      event.target.classList.add('active');
    }

    async function getPairCode() {
      const phone = document.getElementById('phoneInput').value.trim().replace(/[^0-9]/g, '');
      if (!phone || phone.length < 7) {
        alert('Please enter a valid number with country code');
        return;
      }

      const btn = document.getElementById('pairBtn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Connecting...';

      const result = document.getElementById('pairResult');
      result.classList.add('visible');
      document.getElementById('pairStatus').className = 'status';
      document.getElementById('pairStatus').innerHTML = '<span class="spinner"></span> Requesting pairing code...';
      document.getElementById('pairCode').textContent = '';
      document.getElementById('pairSteps').style.display = 'none';
      document.getElementById('sessionSection').style.display = 'none';

      try {
        const res = await fetch('/get-pair-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone })
        });
        const data = await res.json();

        if (data.error) {
          document.getElementById('pairStatus').className = 'status error';
          document.getElementById('pairStatus').textContent = '❌ ' + data.error;
          btn.disabled = false;
          btn.innerHTML = '🔑 Get Pairing Code';
          return;
        }

        currentSid = data.sid;
        document.getElementById('pairStatus').className = 'status success';
        document.getElementById('pairStatus').textContent = '✅ Pairing code ready!';
        document.getElementById('pairCode').textContent = data.code;
        document.getElementById('pairSteps').style.display = 'block';
        btn.innerHTML = '🔄 Waiting for link...';

        // Poll for session
        pollInterval = setInterval(() => pollSession(currentSid), 3000);

      } catch (err) {
        document.getElementById('pairStatus').className = 'status error';
        document.getElementById('pairStatus').textContent = '❌ Error: ' + err.message;
        btn.disabled = false;
        btn.innerHTML = '🔑 Get Pairing Code';
      }
    }

    async function pollSession(sid) {
      try {
        const res = await fetch('/get-session?sid=' + sid);
        const data = await res.json();
        if (data.session) {
          clearInterval(pollInterval);
          document.getElementById('pairSteps').style.display = 'none';
          document.getElementById('sessionSection').style.display = 'block';
          document.getElementById('sessionString').textContent = data.session;
          document.getElementById('pairStatus').textContent = '';
          const btn = document.getElementById('pairBtn');
          btn.disabled = false;
          btn.innerHTML = '🔑 Get New Code';
        }
      } catch (e) {}
    }

    function copySession() {
      const text = document.getElementById('sessionString').textContent;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = '✅ Copied!';
        setTimeout(() => btn.textContent = '📋 Copy Session ID', 2000);
      });
    }
  </script>
</body>
</html>`);
});

// ─── API: GET PAIR CODE ───────────────────────────────────────────────────────
app.post('/get-pair-code', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.json({ error: 'Phone number required' });

  const sid = makeId();
  const sessionFolder = `./sessions/${sid}`;

  if (!fs.existsSync('./sessions')) fs.mkdirSync('./sessions');
  fs.mkdirSync(sessionFolder, { recursive: true });

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['TroyBot', 'Chrome', '1.0.0'],
    });

    sessions[sid] = { sock, sessionString: null, status: 'waiting' };

    sock.ev.on('creds.update', saveCreds);

    // Wait a moment then request pairing code
    await new Promise(r => setTimeout(r, 1500));
    const code = await sock.requestPairingCode(phone);
    const formatted = code.match(/.{1,4}/g).join('-');

    sock.ev.on('connection.update', async (update) => {
      const { connection } = update;
      if (connection === 'open') {
        await new Promise(r => setTimeout(r, 3000));
        try {
          const credsPath = path.join(sessionFolder, 'creds.json');
          if (fs.existsSync(credsPath)) {
            const credsData = fs.readFileSync(credsPath);
            const compressed = zlib.gzipSync(credsData);
            const b64 = compressed.toString('base64');
            sessions[sid].sessionString = `TroyBot!${b64}`;
            sessions[sid].status = 'done';
          }
        } catch (e) {
          sessions[sid].status = 'error';
        }
        // Clean up after 10 min
        setTimeout(() => {
          cleanSession(sid);
          delete sessions[sid];
        }, 600000);
      }
    });

    res.json({ sid, code: formatted });

  } catch (err) {
    cleanSession(sid);
    delete sessions[sid];
    res.json({ error: err.message || 'Failed to get pairing code' });
  }
});

// ─── API: POLL FOR SESSION ────────────────────────────────────────────────────
app.get('/get-session', (req, res) => {
  const { sid } = req.query;
  if (!sid || !sessions[sid]) return res.json({ session: null });
  if (sessions[sid].sessionString) {
    return res.json({ session: sessions[sid].sessionString });
  }
  res.json({ session: null });
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n╭━━━━━━━━━━━━━━━━━━━━━━━╮`);
  console.log(`┃   🤖  TROY BOT         ┃`);
  console.log(`┃   Session Generator    ┃`);
  console.log(`┃   Running on :${PORT}     ┃`);
  console.log(`╰━━━━━━━━━━━━━━━━━━━━━━━╯\n`);
});
