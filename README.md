# 🐂 BullsRentWise

**UB Student Rental Risk Checker** - Quickly scan Buffalo rental addresses for 311 complaints and weather-related risks.

## What It Does

BullsRentWise helps UB students quickly scan a Buffalo rental address for:
- **311 Complaints**: Heat, leak, pest, noise, and sanitation violations in the last 90 days
- **Weather & Mold Risk**: National Weather Service trends plus mold/moisture heuristics
- **Crime Data**: Violent, property, drug, and vandalism incidents around the neighborhood
- **AI Assistants**: Complaint summaries, GPT chat, risk prediction, and spoken audio briefings
- **Property Media**: Google Places photos with automatic Street View fallback
- **Budget Tracking**: Split rent, utilities, and affordability per roommate
- **Roommate Collaboration**: Supabase groups with share codes, votes, and comments
- **Risk Score**: 0–100 rating with map overlays and red-flag callouts
- **Saved Addresses**: ⭐ Local favorites with optional Supabase sync across devices

## Tech Stack

### Frontend
- **Next.js 14** (App Router) - React framework with API routes
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Leaflet** - Interactive maps
- **Leaflet** - Map library

### Backend (Next.js API Routes)
- **Geocoding**: OpenStreetMap Nominatim
- **311 Complaints**: Buffalo Open Data Portal (Socrata SODA API)
- **Crime Reports**: Buffalo Open Data Portal
- **Weather & Mold**: National Weather Service feeds plus derived mold risk index
- **Pest & Mold Hotline**: Tenant agency guidance and escalation steps
- **AI + Audio**: OpenAI GPT-4o-mini / GPT-3.5 chat, summaries, and text-to-speech
- **Property Media**: Google Places Photos with Street View fallback
- **Roommates Collaboration**: Supabase REST + Realtime for groups, votes, comments
- **Storage**: Browser localStorage with Supabase sync tables

### Why Next.js API Routes?

✅ **CORS handling** - Some APIs block browser requests  
✅ **API key protection** - Hide sensitive keys server-side  
✅ **Rate limiting** - Control API usage  
✅ **Caching** - 311 data doesn't change often  
✅ **Serverless** - Deploy easily to Vercel/Netlify  

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables** (create `.env.local`):
```env
# Buffalo Open Data (https://data.buffalony.gov)
BUFFALO_311_DATASET_ID=311-dataset-id
BUFFALO_CRIME_DATASET_ID=crime-dataset-id
BUFFALO_API_TOKEN=optional-socrata-token

# AI + Audio (https://platform.openai.com/)
OPENAI_API_KEY=sk-your-openai-key

# Property Media (https://console.cloud.google.com/apis/credentials)
GOOGLE_API_KEY=your-google-api-key

# Supabase (https://supabase.com) for roommates + cloud sync
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional alternative data providers
OPENWEATHER_API_KEY=optional
WEATHERAPI_KEY=optional
CRIMEOMETER_API_KEY=optional
```

> Demo Supabase credentials live in the repo for local testing—swap them out before deploying.

3. **Run development server:**
```bash
npm run dev
```

4. **Open browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── geocode/route.ts      # Geocoding API (OpenStreetMap)
│   │   ├── complaints/route.ts    # 311 complaints API (Buffalo Open Data)
│   │   ├── crime/route.ts         # Crime data API (Buffalo Open Data)
│   │   ├── weather/route.ts       # Weather + mold index API
│   │   ├── pest-mold/route.ts     # Tenant hotline resources
│   │   ├── roommates/route.ts     # Supabase roommate API
│   │   └── ai/
│   │       ├── analyze-complaint/route.ts  # AI complaint analysis
│   │       ├── audio-summary/route.ts      # GPT text-to-speech summaries
│   │       ├── chat/route.ts               # AI chatbot
│   │       ├── predict-risk/route.ts       # ML risk prediction
│   │       └── recommend-housing/route.ts  # Housing suggestions
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Main page
│   └── globals.css                # Global styles
├── components/
│   ├── AddressInput.tsx           # Address input form
│   ├── RiskResults.tsx            # Risk score + map display
│   ├── SavedAddresses.tsx         # Saved addresses sidebar
│   ├── AIChatbot.tsx              # AI chatbot assistant
│   ├── AIRiskPrediction.tsx       # ML risk predictions
│   ├── AIComplaintAnalysis.tsx    # AI complaint analysis
│   ├── BudgetTracker.tsx          # Budget and affordability tracker
│   ├── RoommatesManager.tsx       # Supabase roommate collaboration hub
│   └── PropertyPhotos.tsx         # Google Places + Street View gallery
├── lib/
│   └── supabaseClient.ts          # Supabase helpers
├── DEPLOY.md                      # Hosting + CI/CD notes
└── package.json
```

## Buffalo 311 API Setup

The app is configured to work with Buffalo's Open Data Portal (Socrata). To enable 311 complaints:

1. **Find the Dataset ID:**
   - Visit: https://data.buffalony.gov
   - Search for "311" or "service requests"
   - Get the dataset ID from the URL or API documentation

2. **Configure Environment Variable:**
   - Add `BUFFALO_311_DATASET_ID=your-dataset-id` to `.env.local`
   - Optionally add `BUFFALO_API_TOKEN` if required

3. **See `BUFFALO_311_SETUP.md` for detailed setup instructions**

The API integration includes:
- ✅ Location-based filtering (800m radius)
- ✅ Date filtering (last 90 days)
- ✅ Complaint type filtering (heat, leaks, pests)
- ✅ Distance calculation
- ✅ Graceful error handling

### Supabase Setup (Roommates + Cloud Sync)

1. **Create a project** at [supabase.com](https://supabase.com) and copy the project URL + anon key.
2. **Create the tables** (enable `uuid-ossp` if prompted):
```sql
CREATE TABLE IF NOT EXISTS saved_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  address text,
  risk_score int,
  lat double precision,
  lng double precision,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roommate_groups (
  share_code text PRIMARY KEY,
  roommates jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now()
);
```
3. **Enable Row Level Security** and add lightweight policies:
```sql
ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE roommate_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved addresses read" ON saved_addresses
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "saved addresses write" ON saved_addresses
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "roommates read" ON roommate_groups
  FOR SELECT USING (true);

CREATE POLICY "roommates write" ON roommate_groups
  FOR INSERT WITH CHECK (true);

CREATE POLICY "roommates update" ON roommate_groups
  FOR UPDATE USING (true) WITH CHECK (true);
```

> These policies are hackathon-friendly; tighten them for production (e.g., restrict by auth role or service key).

4. **Paste `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`** into `.env.local`.
5. Restart `npm run dev` so the Supabase client picks up your credentials.

## API Endpoints

### POST `/api/geocode`
Geocode an address to lat/lng.

**Request:**
```json
{ "address": "123 Main St, Buffalo, NY" }
```

**Response:**
```json
{ "lat": 42.8864, "lng": -78.8784 }
```

### POST `/api/complaints`
Fetch 311 complaints near a location.

**Request:**
```json
{ "lat": 42.8864, "lng": -78.8784, "radius": 800 }
```

**Response:**
```json
[
  {
    "type": "Heat Complaint",
    "description": "No heat in apartment",
    "date": "2024-01-15",
    "lat": 42.8864,
    "lng": -78.8784
  }
]
```

### POST `/api/weather`
Fetch weather data (humidity/precipitation).

**Request:**
```json
{ "lat": 42.8864, "lng": -78.8784 }
```

**Response:**
```json
{
  "avgHumidity": 75.5,
  "totalPrecip": 0.8,
  "periods": [...]
}
```

### `/api/roommates`
- `GET /api/roommates?shareCode=ABCD123` → Fetch roommates for a share code
- `POST` body `{ shareCode, roommates: [...] }` → Create or overwrite a group
- `PUT` body `{ shareCode, roommate: {...} }` → Add or update a roommate
- `DELETE /api/roommates?shareCode=ABCD123&roommateId=rm_123` → Remove a roommate

### POST `/api/ai/audio-summary`
Generate an MP3 briefing via OpenAI text-to-speech. Returns a signed URL for playback.

### GET `/api/pest-mold`
Provides hotline numbers, checklists, and local agencies when pest or mold issues are detected.

## Risk Score Calculation

The risk score (0-100) is calculated based on:

- **311 Complaints:**
  - Heat complaints: +15 points each
  - Leak complaints: +20 points each
  - Pest complaints: +15 points each

- **Weather Risk:**
  - Humidity > 70%: +10 points
  - Humidity > 80%: +10 points
  - Precipitation > 0.5": +15 points
  - Precipitation > 1.0": +10 points

- **Crime Risk:**
  - Violent crimes: +25 points each
  - Property crimes: +10 points each
  - Drug crimes: +8 points each
  - Vandalism: +5 points each
  - Other crimes: +3 points each
  - High crime density (>10 crimes): +10 points
  - Very high crime density (>20 crimes): +20 points

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Deploy the .next folder
```

See `DEPLOY.md` for end-to-end Vercel/Netlify deployment steps, cron ideas, and CI tips.

## License

MIT
## Contributing

- Hazel Mahajan (UBIT 50592568)
- Shubham Vikas Soni (UBIT 50593888)

We welcome forks, issues, and pull requests—feel free to build on BullsRentWise!


