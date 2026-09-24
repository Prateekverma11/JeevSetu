# 🚀 Deployment Guide: JeevSetu (Animal Rescuer)

This guide provides step-by-step instructions for deploying JeevSetu using **Option 1**:
- **Backend (Node.js + Express + Socket.IO)** on **[Render.com](https://render.com)** (or Railway)
- **Frontend (Vite + React)** on **[Vercel.com](https://vercel.com)**

---

## 📌 Step 1: Deploy Backend on Render (Free)

1. Sign in to **[Render.com](https://dashboard.render.com/)** (login with your GitHub account).
2. Click **New +** → **Web Service**.
3. Connect your repository: `https://github.com/Prateekverma11/JeevSetu.git`
4. Configure the Web Service settings:
   - **Name**: `jeevsetu-backend` (or your preferred name)
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`

5. Add **Environment Variables** (under *Advanced* → *Add Environment Variable*):

| Key | Example / Description |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `5001` |
| `MONGO_URI` | `mongodb+srv://...` (your MongoDB connection string) |
| `JWT_SECRET` | `supersecretjwtkey123` (or any strong random string) |
| `LLM_API_KEY` | `gsk_...` (your Groq API key for RescueAI) |

6. Click **Deploy Web Service**.
7. Once deployed, copy your live backend URL (e.g. `https://jeevsetu-backend.onrender.com`).
   - Test it by visiting: `https://jeevsetu-backend.onrender.com/api/health` → should return `{"status":"ok", ...}`

---

## 📌 Step 2: Deploy Frontend on Vercel (Free)

1. Sign in to **[Vercel.com](https://vercel.com/)** with your GitHub account.
2. Click **Add New...** → **Project**.
3. Import the `JeevSetu` repository (`Prateekverma11/JeevSetu`).
4. Configure the Project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `client`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
   - **Install Command**: `npm install` (default)

5. Add **Environment Variables**:

| Key | Value |
|---|---|
| `VITE_API_URL` | Your Render Backend URL from Step 1 (e.g. `https://jeevsetu-backend.onrender.com`) |
| `VITE_MAPPLS_API_KEY` | `1ff2ca4d8ccd28fe3a821f011ddd3523` (or your Mappls API key) |

6. Click **Deploy**.
7. In ~30 seconds, Vercel will provide your live frontend URL (e.g. `https://jeevsetu.vercel.app`)!

---

## 🔄 Verification Checklist

- [ ] Open frontend URL on desktop & mobile browser.
- [ ] Sign up / Login as Citizen & Rescuer.
- [ ] Submit an animal report with photo & GPS location.
- [ ] Click on animal report photo to test full-size responsive image preview.
- [ ] Rescuer accepts & marks rescue as completed → confirm step 4 checkmark (`✓`) is shown.
- [ ] Open **RescueAI Chatbot** (robot icon in bottom-right) and ask a question.
