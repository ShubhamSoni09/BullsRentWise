# 🚀 Deployment Steps

## Deploy to Vercel (Recommended)

### Step 1: Prepare Your Code

```bash
# Make sure all changes are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Sign up with **GitHub** (recommended) or email

### Step 3: Deploy Your Project

1. Click **"Add New Project"** button
2. **Import your Git repository** (GitHub/GitLab/Bitbucket)
3. Vercel will auto-detect Next.js settings
4. Click **"Deploy"** (you can configure settings later)

### Step 4: Add Environment Variables

1. Go to your project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:

**Required:**
```
NEXT_PUBLIC_SUPABASE_URL=https://sqatwjjnmhutgoevedir.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxYXR3ampubWh1dGdvZXZlZGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzEzNzMsImV4cCI6MjA3ODI0NzM3M30.BxSxGkgvhhWMoETjcnbLmvnv-OqTBxwWoAA3BveGF10
```

**Optional (for full features):**
```
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_key
BUFFALO_311_DATASET_ID=whkc-e5vr
BUFFALO_CRIME_DATASET_ID=d6g9-xbgu
CRIMEOMETER_API_KEY=your_crimeometer_key
OPENWEATHER_API_KEY=your_openweather_key
WEATHERAPI_KEY=your_weatherapi_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

4. Click **"Save"** for each variable
5. Go to **Deployments** tab
6. Click **"Redeploy"** on the latest deployment to apply new variables

### Step 5: Your App is Live!

- Vercel provides a URL like: `https://bulls-rentwise.vercel.app`
- Your app is now live and accessible!

### Step 6: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Enter your domain name
3. Follow DNS configuration instructions
4. SSL certificate is automatic

---

## Deploy to Netlify (Alternative)

### Step 1: Prepare Your Code

```bash
# Make sure all changes are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Create Netlify Account

1. Go to [netlify.com](https://netlify.com)
2. Click **"Sign up"**
3. Sign up with **GitHub** (recommended) or email

### Step 3: Deploy Your Project

**Option A: Via Dashboard (Easiest)**
1. Click **"Add new site"** → **"Import an existing project"**
2. Connect your Git repository (GitHub/GitLab/Bitbucket)
3. Netlify will auto-detect Next.js settings
4. Click **"Deploy site"**

**Option B: Via CLI**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy

# Deploy to production
netlify deploy --prod
```

### Step 4: Configure Build Settings

1. Go to **Site settings** → **Build & deploy**
2. Ensure these settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Node version:** 18 or higher

### Step 5: Add Environment Variables

1. Go to **Site settings** → **Environment variables**
2. Add these variables:

**Required:**
```
NEXT_PUBLIC_SUPABASE_URL=https://sqatwjjnmhutgoevedir.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxYXR3ampubWh1dGdvZXZlZGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzEzNzMsImV4cCI6MjA3ODI0NzM3M30.BxSxGkgvhhWMoETjcnbLmvnv-OqTBxwWoAA3BveGF10
```

**Optional (for full features):**
```
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_key
BUFFALO_311_DATASET_ID=whkc-e5vr
BUFFALO_CRIME_DATASET_ID=d6g9-xbgu
ELEVENLABS_API_KEY=your_elevenlabs_key
```

3. Click **"Save"** for each variable
4. Go to **Deploys** tab
5. Click **"Trigger deploy"** → **"Clear cache and deploy site"** to apply new variables

### Step 6: Create netlify.toml (Optional but Recommended)

Create a `netlify.toml` file in your project root:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Step 7: Your App is Live!

- Netlify provides a URL like: `https://bulls-rentwise.netlify.app`
- Your app is now live and accessible!

### Step 8: Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your domain name
4. Follow DNS configuration instructions
5. SSL certificate is automatic

---

## Why Not Streamlit?

**Streamlit is for Python apps only.** Your app is built with:
- Next.js (JavaScript/TypeScript)
- React
- Node.js

Streamlit is a Python framework for data science apps. To use Streamlit, you'd need to completely rewrite your app in Python, which isn't practical.

**Better alternatives for Next.js:**
- ✅ **Vercel** (made by Next.js creators - best integration)
- ✅ **Netlify** (great Next.js support)
- ✅ **Railway** (good for full-stack apps)
- ✅ **Render** (simple deployment)

---

## Alternative: Deploy via CLI (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## Pre-Deployment Checklist

- [ ] Code pushed to Git repository
- [ ] Test build locally: `npm run build`
- [ ] Environment variables ready
- [ ] Supabase table created (see README.md)
- [ ] All API keys available

---

## Post-Deployment

1. **Test your live site:**
   - Visit your Vercel URL
   - Test address search
   - Test roommate feature
   - Verify all features work

2. **Monitor:**
   - Check Vercel dashboard for build logs
   - Monitor API usage
   - Check Supabase dashboard

---

## Troubleshooting

**Build fails?**
- Check build logs in Vercel dashboard
- Ensure Node.js version is 18+
- Verify all dependencies in package.json

**Environment variables not working?**
- Make sure variables are set in Vercel dashboard
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

**API errors?**
- Verify API keys are correct
- Check API rate limits
- Ensure CORS is configured

---

## That's it! 🎉

Your app should now be live on Vercel!

