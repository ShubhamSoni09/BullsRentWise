# 🐂 BullsRentWise

**UB Student Rental Risk Checker** - Quickly scan Buffalo rental addresses for 311 complaints and weather-related risks.

## What It Does

BullsRentWise helps UB students quickly scan a Buffalo rental address for:
- **311 Complaints**: Recent heat, leak, and pest complaints within 800m radius
- **Weather Risk**: Short-term humidity/precipitation data to flag potential mold/water issues
- **Crime Data**: Recent crime incidents (violent, property, drug, vandalism) within 800m radius
- **AI-Powered Analysis**: NLP complaint analysis, ML risk predictions, and AI chatbot assistant
- **Property Photos**: Google Places API integration for property photos
- **Budget Tracking**: Track rent, utilities, and affordability per person
- **Roommate Connection**: Connect with roommates, share properties, vote and comment
- **Risk Score**: 0-100 risk assessment with visual map and red flags
- **Save Addresses**: ⭐ Save addresses locally (with optional Supabase cloud sync)

## Tech Stack

### Frontend
- **Next.js 14** (App Router) - React framework with API routes
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Leaflet** - Interactive maps
- **Leaflet** - Map library

### Backend (Next.js API Routes)
- **Geocoding API**: OpenStreetMap Nominatim (free, no key needed)
- **311 Data**: Buffalo Open Data Portal (Socrata SODA API) - requires dataset ID
- **Crime Data**: Buffalo Open Data Portal (Socrata SODA API) - requires dataset ID
- **Weather API**: National Weather Service (NWS) - free, no key needed
- **AI/ML**: OpenAI GPT-3.5-turbo (optional, for enhanced features)
- **Google Places API**: For property photos (optional)
- **Storage**: localStorage (local) + Supabase (optional cloud)

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

2. **Set up environment variables** (optional):
Create a `.env.local` file:
```env
# Required for Buffalo 311 API integration
# Find the dataset ID at https://data.buffalony.gov
BUFFALO_311_DATASET_ID=your-dataset-id-here

# Required for Buffalo Crime API integration
# Find the dataset ID at https://data.buffalony.gov (search for "crime" or "police")
BUFFALO_CRIME_DATASET_ID=your-crime-dataset-id-here

# Optional: For Buffalo APIs (if they require authentication)
BUFFALO_API_TOKEN=your_token_here

# Optional: For AI features (OpenAI API)
# Get your key at https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-key-here

# Optional: For Google APIs (Places, Maps, Geocoding, etc.)
# Get your key at https://console.cloud.google.com/apis/credentials
# Enable the APIs you need: "Places API", "Maps JavaScript API", "Geocoding API", etc.
# One API key works for all Google services!
GOOGLE_API_KEY=your-google-api-key-here

# Optional: For Supabase cloud storage
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

**Note:** See `BUFFALO_311_SETUP.md`, `CRIME_DATA_SETUP.md`, and `AI_ML_SETUP.md` for detailed setup instructions.

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
│   │   ├── weather/route.ts       # NWS weather API
│   │   └── ai/
│   │       ├── analyze-complaint/route.ts  # AI complaint analysis
│   │       ├── chat/route.ts               # AI chatbot
│   │       └── predict-risk/route.ts      # ML risk prediction
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
│   ├── RoommateConnector.tsx      # Roommate connection and collaboration
│   ├── SharedPropertyList.tsx     # Shared property list with voting
│   └── PropertyComparison.tsx      # Compare multiple properties
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

### Supabase Integration (Optional)

For cloud storage of saved addresses:

1. **Create Supabase project** at https://supabase.com
2. **Create table:**
```sql
CREATE TABLE saved_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  address TEXT,
  risk_score INTEGER,
  lat DECIMAL,
  lng DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

3. **Update `components/SavedAddresses.tsx`** to sync with Supabase

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

## License

MIT

## Contributing

This is a student project. Feel free to fork and improve!

