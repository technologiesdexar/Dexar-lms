# Deploying Dexar LMS on Render 🚀

This repository is fully configured for deployment on [Render](https://render.com).

---

## Method 1: Automatic Deployment using Render Blueprint (Recommended)

1. Push this repository to your GitHub account (`K-Naveenkumar1/Dexar`).
2. Log in to the [Render Dashboard](https://dashboard.render.com).
3. Click **New +** and select **Blueprint**.
4. Connect your `Dexar` repository.
5. Render will detect the [`render.yaml`](./render.yaml) file automatically and set up:
   - **`dexar-backend`** (Node.js API Web Service)
   - **`dexar-frontend`** (Next.js 16 Web Service)
6. Under environment variables for `dexar-backend`, provide your **`MONGODB_URI`** (e.g. from free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)).
7. Click **Apply**. Both backend and frontend will build and deploy!

---

## Method 2: Manual Deployment (Individual Web Services)

If you prefer to create the services manually in the Render dashboard:

### 1. Deploy the Backend API
1. In Render, click **New +** > **Web Service**.
2. Connect your Git repository.
3. Configure the settings:
   - **Name**: `dexar-backend`
   - **Root Directory**: `backend` *(or leave blank, root `package.json` will route to backend)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Health Check Path**: `/health`
4. Add the following **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGODB_URI`: `<Your MongoDB Atlas connection string>`
   - `JWT_SECRET`: `<Any secure random string>`
   - `RAZORPAY_KEY_ID`: `<Your Razorpay Key ID>`
   - `RAZORPAY_KEY_SECRET`: `<Your Razorpay Key Secret>`
5. Click **Create Web Service**. Once deployed, copy your backend URL (e.g., `https://dexar-backend.onrender.com`).

---

### 2. Deploy the Frontend (Next.js)
1. In Render, click **New +** > **Web Service**.
2. Connect the same Git repository.
3. Configure the settings:
   - **Name**: `dexar-frontend`
   - **Root Directory**: `frontend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add the following **Environment Variable**:
   - `NEXT_PUBLIC_API_URL`: `<Your Backend Render URL, e.g. https://dexar-backend.onrender.com>`
5. Click **Create Web Service**.

---

## Key Fixes Applied for Render:
- ✅ **Root Monorepo `package.json`**: Prevents `Cannot find package.json` when deploying from repository root.
- ✅ **Host Binding (`0.0.0.0`)**: Express and Next.js now explicitly bind to `0.0.0.0:$PORT` so Render reverse proxy detects the open port immediately without timing out.
- ✅ **Non-blocking Server Startup**: Backend starts listening immediately and provides instant 200 OK responses on `/health` and `/` so Render deployment health checks never time out while waiting for database connections.
- ✅ **Dynamic API Resolution**: Frontend `api.ts` automatically consumes `process.env.NEXT_PUBLIC_API_URL` with URL normalization.
- ✅ **`render.yaml` Blueprint**: Enables one-click multi-service provisioning with automatic service-to-service URL injection.
