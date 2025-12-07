# MealScout - Quick Deployment Summary

## ✅ Your Code is Ready to Deploy!

### What You Need:
1. A GitHub account (to push your code)
2. A Render.com account (free - no credit card needed)
3. 10 minutes

---

## 🚀 Deploy in 3 Steps:

### 1️⃣ Push to GitHub
Run this in your terminal:
```bash
git init
git add .
git commit -m "Deploy MealScout"
git remote add origin https://github.com/TradersCorner/MealScout.git
git push -u origin main
```

Or double-click: `deploy.bat` (Windows) or `deploy.sh` (Mac/Linux)

---

### 2️⃣ Create Free Database on Render
1. Go to https://render.com (sign in with GitHub)
2. Click "New +" → "PostgreSQL"
3. Name it `mealscout-db`
4. Select "Free" tier
5. Copy the **Internal Database URL** (looks like: `postgresql://...`)

---

### 3️⃣ Deploy Your Site
1. Click "New +" → "Web Service"
2. Connect your GitHub repo
3. Settings:
   - Build: `npm install && npm run build`
   - Start: `npm start`
   - Free tier
4. Add Environment Variables:
   ```
   DATABASE_URL = <paste the URL from step 2>
   SESSION_SECRET = <any random 32 characters>
   NODE_ENV = production
   PORT = 10000
   ```
5. Click "Create Web Service"

**Done!** Your site will be live at: `https://mealscout.onrender.com`

---

## 🌐 Connect Your Domain

Once live, add your custom domain:
1. Render Dashboard → Settings → Custom Domain
2. Add `mealscout.com` (or your domain)
3. Update DNS at your domain registrar:
   - Type: `CNAME`
   - Name: `@`
   - Value: `mealscout.onrender.com`
4. Wait 5-10 minutes

Your site will be live at `https://mealscout.com` with free SSL!

---

## 💰 Cost: FREE

Render's free tier includes:
- ✅ Web hosting (750 hours/month)
- ✅ PostgreSQL database (90 days free trial, then $7/month)
- ✅ Automatic SSL certificate
- ✅ Automatic deploys from GitHub

**Note:** Free tier "sleeps" after 15 min of inactivity (takes ~30 seconds to wake up on first visit)

---

## 📝 Detailed Guide

See `DEPLOYMENT.md` for full instructions and alternatives (Railway, Vercel, etc.)

---

## ⚡ Auto-Deploy on Every Update

After initial setup, every time you push to GitHub:
```bash
git add .
git commit -m "Update feature"
git push
```

Render automatically rebuilds and deploys your site! No more console commands!

---

## 🆘 Need Help?

Check `DEPLOYMENT.md` for:
- Alternative hosting (Railway, Vercel)
- Troubleshooting
- Environment variables guide
- Database migration steps
