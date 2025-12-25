# 🚀 Vercel Deployment Guide - Frontend

**Backend URL:** https://web-production-91537.up.railway.app/api/v1  
**Frontend:** Deploy to Vercel

---

## 📋 Prerequisites

1. ✅ Backend deployed on Railway (already done)
2. ✅ Vercel account (create at https://vercel.com)
3. ✅ GitHub repository with frontend code
4. ✅ Supabase credentials

---

## 🔧 Step 1: Configure Backend CORS

Before deploying frontend, ensure backend allows your Vercel domain:

### Update Backend Environment Variables in Railway:

Add your Vercel frontend URL to backend's `FRONTEND_URL`:

```
FRONTEND_URL=https://your-app.vercel.app
```

Or if you want to allow multiple origins, update the backend CORS configuration.

**Backend is already configured to accept requests from any origin if DEBUG is true, but for production:**

1. Go to Railway → Your Backend Service → Variables
2. Set `FRONTEND_URL` to your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
3. Redeploy backend if needed

---

## 🌐 Step 2: Deploy Frontend to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit https://vercel.com/dashboard
   - Click "Add New Project"

2. **Import Repository:**
   - Connect your GitHub account if not already connected
   - Select your repository
   - Select the `frontend` folder as the root directory (or deploy entire repo and set root)

3. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `frontend` (if deploying from monorepo)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

4. **Add Environment Variables:**
   Click "Environment Variables" and add:

   ```env
   NEXT_PUBLIC_API_URL=https://web-production-91537.up.railway.app/api/v1
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

   **Important:** Make sure to add these for **Production**, **Preview**, and **Development** environments.

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-app.vercel.app`

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Navigate to frontend directory
cd frontend

# Deploy to production
vercel --prod
```

---

## 🔐 Step 3: Environment Variables

### Required Environment Variables:

Set these in **Vercel Dashboard → Your Project → Settings → Environment Variables**:

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://web-production-91537.up.railway.app/api/v1` | Backend API URL |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Your Supabase anon key |

### How to Get Supabase Credentials:

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## ✅ Step 4: Verify Deployment

After deployment:

1. **Visit your Vercel URL:** `https://your-app.vercel.app`

2. **Test Login:**
   - Go to login page
   - Try logging in with your admin credentials
   - Should redirect to dashboard on success

3. **Check API Connection:**
   - Open browser DevTools → Network tab
   - Try any API call (login, fetch data, etc.)
   - Verify requests go to: `https://web-production-91537.up.railway.app/api/v1`

4. **Check Console:**
   - Open browser DevTools → Console
   - Should see no CORS errors
   - API calls should succeed

---

## 🔄 Step 5: Update Backend CORS (If Needed)

If you get CORS errors, update backend environment variables:

### In Railway Backend Service:

1. Go to **Variables** tab
2. Set `FRONTEND_URL` to your Vercel URL:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Redeploy backend

The backend is configured to:
- Allow all origins if `DEBUG=true`
- Allow only `FRONTEND_URL` if `DEBUG=false` (production)

---

## 🎯 Integration Verification Checklist

- [ ] Frontend deployed on Vercel
- [ ] Environment variables set in Vercel
- [ ] Backend CORS configured (FRONTEND_URL set)
- [ ] Can access frontend URL
- [ ] Login page loads
- [ ] Can login successfully
- [ ] API calls work (check Network tab)
- [ ] No CORS errors in console
- [ ] Data loads correctly from backend
- [ ] All pages accessible after login

---

## 🐛 Troubleshooting

### Issue: CORS Errors

**Solution:**
1. Verify `FRONTEND_URL` is set in backend environment variables
2. Make sure it matches your exact Vercel URL (including `https://`)
3. Redeploy backend after changing environment variables

### Issue: API Calls Fail (404 or Connection Refused)

**Solution:**
1. Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
2. Check that backend is running: https://web-production-91537.up.railway.app/health
3. Verify the URL ends with `/api/v1` (no trailing slash)

### Issue: Authentication Not Working

**Solution:**
1. Check browser console for errors
2. Verify Supabase credentials are correct
3. Check that backend authentication endpoint is accessible
4. Verify token is being stored in localStorage

### Issue: Environment Variables Not Working

**Solution:**
1. Make sure variables start with `NEXT_PUBLIC_` (required for client-side access)
2. Redeploy after adding/changing environment variables
3. Clear browser cache and hard refresh (Ctrl+Shift+R)

---

## 📝 Quick Reference

### Backend URLs:
- **API Base:** https://web-production-91537.up.railway.app/api/v1
- **Health Check:** https://web-production-91537.up.railway.app/health
- **Root:** https://web-production-91537.up.railway.app/

### Frontend URLs (After Deployment):
- **Production:** `https://your-app.vercel.app`
- **Preview:** `https://your-app-git-branch.vercel.app` (for PR previews)

### Environment Variables Summary:

**Backend (Railway):**
- `FRONTEND_URL` - Your Vercel frontend URL

**Frontend (Vercel):**
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key

---

## 🚀 Deployment Status

**Backend:** ✅ Deployed on Railway  
**Frontend:** ⏳ Deploy to Vercel  
**Integration:** ⏳ Configure after deployment

---

**Last Updated:** 2025-12-24



