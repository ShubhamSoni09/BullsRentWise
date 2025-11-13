# 🔑 Supabase Credentials Guide

## Where to Find Your Supabase Credentials

### Step 1: Go to Supabase Dashboard

1. Visit: **https://sqatwjjnmhutgoevedir.supabase.co** (your project URL)
2. Or go to: **https://supabase.com/dashboard**
3. Login to your Supabase account
4. Select your project: **sqatwjjnmhutgoevedir**

### Step 2: Find Your Credentials

1. Click on **Settings** (gear icon) in the left sidebar
2. Click on **API** in the settings menu
3. You'll see:

**Project URL:**
```
https://sqatwjjnmhutgoevedir.supabase.co
```
(This is your `NEXT_PUBLIC_SUPABASE_URL`)

**anon/public key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxYXR3ampubWh1dGdvZXZlZGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzEzNzMsImV4cCI6MjA3ODI0NzM3M30.BxSxGkgvhhWMoETjcnbLmvnv-OqTBxwWoAA3BveGF10
```
(This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

---

## Where to Add Credentials

### Option 1: Local Development (.env.local)

1. **Create `.env.local` file** in your project root (same folder as `package.json`)

2. **Add these lines:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://sqatwjjnmhutgoevedir.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxYXR3ampubWh1dGdvZXZlZGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzEzNzMsImV4cCI6MjA3ODI0NzM3M30.BxSxGkgvhhWMoETjcnbLmvnv-OqTBxwWoAA3BveGF10
```

3. **Restart your dev server:**
```bash
# Stop the server (Ctrl+C)
npm run dev
```

**Note:** `.env.local` is already in `.gitignore`, so it won't be committed to Git.

---

### Option 2: Vercel Deployment (Production)

1. **Go to Vercel Dashboard:**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project

2. **Navigate to Settings:**
   - Click **Settings** tab
   - Click **Environment Variables** in the left menu

3. **Add Variables:**
   - Click **"Add New"** button
   - Add each variable:

   **Variable 1:**
   - **Name:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** `https://sqatwjjnmhutgoevedir.supabase.co`
   - **Environment:** Select all (Production, Preview, Development)
   - Click **"Save"**

   **Variable 2:**
   - **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxYXR3ampubWh1dGdvZXZlZGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzEzNzMsImV4cCI6MjA3ODI0NzM3M30.BxSxGkgvhhWMoETjcnbLmvnv-OqTBxwWoAA3BveGF10`
   - **Environment:** Select all (Production, Preview, Development)
   - Click **"Save"**

4. **Redeploy:**
   - Go to **Deployments** tab
   - Click **"..."** (three dots) on latest deployment
   - Click **"Redeploy"**
   - This applies the new environment variables

---

## Your Current Credentials (Already Configured)

Your Supabase credentials are already set in the code:

**URL:**
```
https://sqatwjjnmhutgoevedir.supabase.co
```

**Anon Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxYXR3ampubWh1dGdvZXZlZGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzEzNzMsImV4cCI6MjA3ODI0NzM3M30.BxSxGkgvhhWMoETjcnbLmvnv-OqTBxwWoAA3BveGF10
```

These are already in `lib/supabaseClient.ts` as fallback values, but it's better to use environment variables.

---

## Verify Credentials Work

1. **Test locally:**
   - Add to `.env.local`
   - Restart dev server
   - Test roommate feature

2. **Test in production:**
   - Add to Vercel environment variables
   - Redeploy
   - Test on live site

---

## Security Note

- ✅ The **anon key** is safe to use in frontend code (it's public)
- ✅ It's already in your code as a fallback
- ❌ Never commit `.env.local` to Git (it's in `.gitignore`)
- ✅ Always use environment variables in production

---

## Quick Reference

**Local (.env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://sqatwjjnmhutgoevedir.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxYXR3ampubWh1dGdvZXZlZGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzEzNzMsImV4cCI6MjA3ODI0NzM3M30.BxSxGkgvhhWMoETjcnbLmvnv-OqTBxwWoAA3BveGF10
```

**Vercel Dashboard:**
- Settings → Environment Variables → Add New


