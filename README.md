# TroyBot Session Generator

Web-based WhatsApp pairing code & session generator for TroyBot.

## How to deploy on Render (free)

1. Upload this folder to a new GitHub repo
2. Go to render.com → New Web Service → connect your repo
3. Set start command: `node index.js`
4. Deploy — you get a live URL like `https://troybot-session.onrender.com`

## How to use

1. Open your deployed URL in browser
2. Enter your WhatsApp number: `265894016453`
3. Click **Get Pairing Code**
4. On your phone: WhatsApp → Settings → Linked Devices → Link a Device → Link with phone number instead
5. Enter the 8-digit code shown
6. Wait a few seconds — your session string appears:
   ```
   TroyBot!H4sIAAAA......
   ```
7. Copy it and paste into TroyBot `config.js`:
   ```js
   sessionID: 'TroyBot!H4sIAAAA......',
   ```
8. Deploy TroyBot on KataBump — done!

## Owner
Troy | +265894016453
