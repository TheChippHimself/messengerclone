# 📱 Messenger Clone — Fake Chat Generator

A pixel-accurate Facebook Messenger clone built with pure HTML, CSS, and JavaScript.
No backend, no frameworks — fully deployable on Netlify static hosting.

---

## 🗂️ File Structure

```
messenger-app/
├── index.html          ← Profile selection / login page
├── chat.html           ← Main messenger chat interface
├── netlify.toml        ← Netlify configuration
├── css/
│   ├── main.css        ← Global styles, variables, reset, animations
│   ├── index.css       ← Profile selection page styles
│   └── chat.css        ← Chat interface styles
└── js/
    ├── storage.js      ← Data persistence (localStorage)
    ├── utils.js        ← Shared utility functions
    ├── index.js        ← Profile selection page logic
    └── chat.js         ← Chat interface logic
```

---

## ✨ Features

### Profile System
- Create multiple profiles with custom names and photos
- Each profile has its own isolated data (conversations, messages)
- Profile switching returns to login screen

### Messenger UI Clone
- Pixel-accurate Messenger layout (sidebar + chat area)
- Sender/receiver chat bubbles with proper corner rounding
- Message grouping for consecutive messages from same sender
- Date separators between message groups
- Online status indicator

### Chat Creation
- Create new conversations with contact name + photo
- Avatar upload with live preview
- Conversations appear in sidebar with last message preview

### Messaging System
- Send text messages (Enter to send, Shift+Enter for new line)
- Auto "Seen" status after 1.5 seconds
- Auto 🫀 reaction after 2.5 seconds
- Timestamps and message grouping

### Image Messaging
- Upload images from device (click the image icon)
- Drag and drop images onto chat area
- Paste images from clipboard (Ctrl+V / Cmd+V)
- Preview before sending
- Images display in chat bubbles with zoom on click
- Full-size zoom modal (click any image)

### Data Persistence
- All data stored in localStorage
- Persists across page refreshes and browser restarts
- Per-profile data isolation

### JSON Export / Import
- Export any conversation to .json file
- Import .json to recreate full conversation (including images)
- Export includes: profile info, contact info, all messages, timestamps, reactions, seen status

### Dark Mode
- Toggle via moon icon in chat header
- Preference saved and persists

### Bonus Features
- Right-click messages to delete them
- Scroll to bottom auto-behavior
- Search conversations in sidebar
- Responsive/mobile layout with back button
- Image zoom modal (click any image to enlarge)
- Context menu on message right-click

---

## 🚀 Deploy to Netlify

### Option 1: Drag and Drop (Easiest)
1. Zip the entire `messenger-app/` folder
2. Go to [netlify.com](https://netlify.com) → Log in
3. Go to your dashboard → "Add new site" → "Deploy manually"
4. Drag the zip file onto the deploy area
5. Done! Your site is live instantly.

### Option 2: GitHub + Netlify CI
1. Push this folder to a GitHub repository
2. Go to [netlify.com](https://netlify.com) → "Add new site" → "Import from Git"
3. Connect your GitHub account and select the repository
4. Build settings:
   - **Build command**: *(leave empty)*
   - **Publish directory**: `.` (or the folder name)
5. Click "Deploy site"

### Option 3: Netlify CLI
```bash
npm install -g netlify-cli
cd messenger-app
netlify deploy --prod --dir .
```

---

## 💻 Local Development

No build step needed! Just open with any local server:

```bash
# Using Python
python3 -m http.server 3000

# Using Node.js npx
npx serve .

# Using VS Code
# Install "Live Server" extension, right-click index.html → "Open with Live Server"
```

Then open `http://localhost:3000` in your browser.

> **Note**: Opening `index.html` directly as a `file://` URL works for basic functionality, but some browser security policies may restrict localStorage in file:// context. Use a local server for best results.

---

## 📦 Storage Notes

- All data is stored in your browser's `localStorage`
- Images are stored as base64 strings (be mindful of storage limits ~5-10MB per origin)
- No data is sent to any server — everything is local
- To reset all data: Open DevTools → Application → Local Storage → Clear all

---

## 🔒 Privacy

This is a **100% client-side** application:
- Zero server requests
- Zero external API calls
- All data stays in your browser
- Safe to use for private/sensitive chat mockups

---

## 🎨 Customization

To change the accent color, edit `css/main.css`:
```css
:root {
  --msg-blue: #0084FF;     /* Main blue */
  --msg-blue-dark: #006AFF; /* Darker blue */
}
```

---

Built with ❤️ — pure HTML, CSS, and Vanilla JavaScript.
