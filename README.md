# ClubMonkey

## About
ClubMonkey is a campus-focused social and collaboration platform where students can discover clubs, join communities, follow members, and collaborate on projects.

It includes:
- A FastAPI backend for auth, clubs, projects, profile, and recommendations
- A Next.js frontend with dashboard, club pages, profile, onboarding, and collaboration hub

## Features
- Google/Firebase-based login flow
- Personalized club recommendations based on interests
- Search suggestions on dashboard
- First-time onboarding overlay with reopen option
- Club pages with dynamic aurora backgrounds per club theme
- Mock showcase interactions:
	- Follow/Following on dashboard members
	- Join/Joined club state on club pages
	- Post upvote toggles on club pages
	- Profile stats (Joined Clubs, Upvotes, Following)
	- Update interests from profile
- Collaboration hub with project listing
- Tiny toast feedback for key actions

## Make It Work
### 1. Backend setup
From the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -U pip
pip install fastapi uvicorn sqlalchemy psycopg2-binary firebase-admin pydantic
```

Then run backend:

```powershell
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend setup
In a new terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

### 3. Required config
- Keep `service-account.json` in project root for Firebase Admin verification.
- If needed, set `NEXT_PUBLIC_API_BASE_URL` to your backend URL.

### 4. Environment files
Create local env files from examples (do not commit real secrets):

```powershell
copy .env.example .env
copy frontend\.env.example frontend\.env
```

made with ❤️ 

