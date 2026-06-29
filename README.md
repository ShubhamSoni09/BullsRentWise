# 🐂 BullsRentWise

**US Rental Risk Checker** - Quickly scan US rental addresses for safety, weather, complaint, affordability, and roommate decision signals.

## What It Does

BullsRentWise helps renters quickly scan a US rental address for:
- **Full-address validation**: Requires city and state so vague searches do not produce misleading reports
- **Risk Score**: 0-100 rating based on complaints, weather, and crime signals
- **Local Complaint History**: City 311/code complaint data where an integrated local dataset is available
- **Weather & Mold Risk**: National Weather Service trends plus mold/moisture heuristics
- **Crime Data**: National-capable CrimeoMeter support when configured, with Buffalo Open Data fallback for Buffalo-area addresses
- **Nearby Amenities**: OpenStreetMap/Overpass-powered groceries, restaurants, cafes, gyms, parks, libraries, and transit
- **Property Media**: Google Places photos with automatic Street View fallback
- **AI Assistants**: Complaint summaries, GPT chat, risk prediction, and spoken audio briefings
- **Budget Tracking**: Split rent, utilities, and affordability per roommate
- **Roommate Collaboration**: Supabase groups with share codes
- **Market Recommendations**: Preference-aware shortlist generation from saved/searched locations
- **Saved Addresses**: Local favorites with optional Supabase sync across devices
- **Responsive UI**: Premium desktop, tablet, and mobile layouts

## Tech Stack

### Frontend
- **Next.js 14** (App Router) - React framework with API routes
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Leaflet** - Interactive maps
- **Leaflet** - Map library

### Backend (Next.js API Routes)
- **Geocoding**: OpenStreetMap Nominatim
- **311 Complaints**: Local city open-data adapters where available; Buffalo Open Data is currently integrated
- **Crime Reports**: CrimeoMeter when configured, with Buffalo Open Data fallback for Buffalo-area addresses
- **Weather & Mold**: National Weather Service feeds plus derived mold risk index
- **Pest & Mold Hotline**: Tenant agency guidance and escalation steps
- **AI + Audio**: OpenAI GPT-4o-mini / GPT-3.5 chat, summaries, and text-to-speech
- **Property Media**: Google Places Photos with Street View fallback
- **Amenities**: OpenStreetMap Overpass API
- **Roommates Collaboration**: Supabase REST + Realtime for groups, votes, comments
- **Storage**: Browser localStorage with Supabase sync tables

### Why Next.js API Routes?

✅ **CORS handling** - Some APIs block browser requests
✅ **API key protection** - Hide sensitive keys server-side
✅ **Rate limiting** - Control API usage
✅ **Graceful fallbacks** - App remains usable when optional providers are missing
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
# Local open data currently integrated for Buffalo (https://data.buffalony.gov)
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

# Optional national/alternative data providers
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
│   │   ├── complaints/route.ts    # Local 311/code complaint API
│   │   ├── crime/route.ts         # Crime data API
│   │   ├── weather/route.ts       # Weather + mold index API
│   │   ├── amenities/route.ts     # OpenStreetMap/Overpass amenities
│   │   ├── commute/route.ts       # Local mobility estimates
│   │   ├── pest-mold/route.ts     # Pest/mold complaint signals
│   │   ├── places/photos/route.ts # Google Places + Street View media
│   │   ├── properties/search/route.ts # Market-style recommendation candidates
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
│   ├── RiskResults.tsx            # Risk score + report tabs
│   ├── SavedAddresses.tsx         # Saved addresses sidebar
│   ├── AIChatbot.tsx              # AI chatbot assistant
│   ├── AIRiskPrediction.tsx       # ML risk predictions
│   ├── AIComplaintAnalysis.tsx    # AI complaint analysis
│   ├── BudgetTracker.tsx          # Budget and affordability tracker
│   ├── RoommatesManager.tsx       # Supabase roommate collaboration hub
│   ├── AIRecommendations.tsx      # Market recommendations
│   ├── CommuteAnalysis.tsx        # Local mobility and trip estimates
│   ├── NearbyAmenities.tsx        # Amenity discovery
│   └── PropertyPhotos.tsx         # Google Places + Street View gallery
├── lib/
│   └── supabaseClient.ts          # Supabase helpers
├── public/images/                 # Public image assets
└── package.json
```

## Data Coverage Notes

BullsRentWise is US-wide for address lookup, weather, photos, amenities, budget tools, saved addresses, roommate tools, and AI features.

Some data sources are naturally city-specific:

- **311/code complaints**: Currently integrated for Buffalo Open Data. Other cities can be added with new adapters.
- **Pest/mold complaint history**: Uses local complaint data where integrated; otherwise returns a safe empty state.
- **Crime data**: Use `CRIMEOMETER_API_KEY` for national incident data. Buffalo Open Data remains as a fallback for Buffalo-area searches.

The app handles missing optional providers gracefully so deployment is not blocked by every API key.

## Buffalo Open Data Setup

1. **Find the Dataset ID:**
   - Visit: https://data.buffalony.gov
   - Search for "311" or "service requests"
   - Get the dataset ID from the URL or API documentation

2. **Configure Environment Variable:**
   - Add `BUFFALO_311_DATASET_ID=your-dataset-id` to `.env.local`
   - Add `BUFFALO_CRIME_DATASET_ID=your-dataset-id` to enable Buffalo crime fallback
   - Optionally add `BUFFALO_API_TOKEN` if required

The API integration includes:
- ✅ Location-based filtering (800m radius)
- ✅ Date filtering (last 90 days)
- ✅ Complaint type filtering (heat, leaks, pests)
- ✅ Distance calculation
- ✅ Graceful fallback outside integrated local coverage

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
Geocode a full US address to coordinates and city/state metadata. The app expects a specific address with city and state.

**Request:**
```json
{ "address": "350 5th Ave, New York, NY" }
```

**Response:**
```json
{
  "lat": 40.7484,
  "lng": -73.9857,
  "city": "New York",
  "state": "New York",
  "country": "United States",
  "displayName": "350 5th Ave, New York, NY, United States"
}
```

### POST `/api/complaints`
Fetch local 311/code complaints near a location where a local dataset is integrated.

**Request:**
```json
{ "lat": 40.7484, "lng": -73.9857, "radius": 800 }
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
{ "lat": 40.7484, "lng": -73.9857 }
```

**Response:**
```json
{
  "avgHumidity": 75.5,
  "totalPrecip": 0.8,
  "periods": [...]
}
```

### POST `/api/amenities`
Find nearby amenities using OpenStreetMap/Overpass.

**Request:**
```json
{ "lat": 40.7484, "lng": -73.9857, "radius": 5 }
```

### POST `/api/commute`
Estimate local mobility, nearby transit distance, walkability, and trip times.

**Request:**
```json
{ "lat": 40.7484, "lng": -73.9857 }
```

### POST `/api/places/photos`
Fetch Google Places photos or Street View fallback for a specific address.

**Request:**
```json
{ "address": "350 5th Ave, New York, NY", "lat": 40.7484, "lng": -73.9857 }
```

### `/api/roommates`
- `GET /api/roommates?shareCode=ABCD123` → Fetch roommates for a share code
- `POST` body `{ shareCode, roommates: [...] }` → Create or overwrite a group
- `PUT` body `{ shareCode, roommate: {...} }` → Add or update a roommate
- `DELETE /api/roommates?shareCode=ABCD123&roommateId=rm_123` → Remove a roommate

### POST `/api/ai/audio-summary`
Generate an MP3 briefing via OpenAI text-to-speech. Returns a signed URL for playback.

### POST `/api/pest-mold`
Fetch pest/mold complaint signals where a city complaint dataset is integrated.

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

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
This repo includes `netlify.toml` with `@netlify/plugin-nextjs` and `NODE_VERSION=18`.

```bash
npm run build
```

Before deploying, configure the same environment variable names listed above in your host dashboard. Do not rename keys unless the code is updated at the same time.

## License

MIT
## Contributing

- Hazel Mahajan (UBIT 50592568)
- Shubham Vikas Soni (UBIT 50593888)

We welcome forks, issues, and pull requests—feel free to build on BullsRentWise!


