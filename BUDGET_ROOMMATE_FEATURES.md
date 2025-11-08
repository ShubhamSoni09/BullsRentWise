# 💰 Budget & Roommate Features

## New Features Added

### 1. 💰 Budget Tracker

**What it does:**
- Track monthly budget per person
- Input estimated rent and utilities
- Calculate per-person costs based on roommate count
- Affordability analysis with visual indicators
- Budget usage percentage
- Save budget for each property

**Features:**
- ✅ Monthly budget input
- ✅ Rent estimation
- ✅ Utilities tracking
- ✅ Per-person cost calculation
- ✅ Affordability check (green/red indicators)
- ✅ Budget usage bar
- ✅ Automatic savings to localStorage

**How to use:**
1. Enter your monthly budget
2. Enter estimated rent
3. Set number of roommates
4. Add utilities estimate
5. See affordability analysis automatically
6. Click "Save Budget" to store

---

### 2. 👥 Roommate Connector

**What it does:**
- Connect with roommates using share codes
- Add roommate information (name, email, budget, preferences)
- Generate unique share codes for each property
- Join existing groups with share codes
- View all connected roommates
- See average budget across roommates

**Features:**
- ✅ Share code generation
- ✅ Add/remove roommates
- ✅ Join with code
- ✅ Share via native share API or clipboard
- ✅ Roommate budget tracking
- ✅ Total budget calculation

**How to use:**
1. Click "Add Roommate" to add someone
2. Share the code with roommates
3. Roommates can join using "Join Existing Group"
4. View all connected roommates and their budgets

---

### 3. 📋 Shared Property List

**What it does:**
- Collaborative property evaluation
- Vote on properties (👍 Yes / 👎 No)
- Add comments on properties
- See approval rates
- Track who added each property
- Real-time collaboration

**Features:**
- ✅ Voting system (Yes/No)
- ✅ Comments on properties
- ✅ Approval rate calculation
- ✅ Property sharing
- ✅ User identification
- ✅ Timestamps

**How to use:**
1. Roommates automatically see shared properties
2. Vote 👍 or 👎 on properties
3. Add comments with thoughts/concerns
4. See approval rates to make decisions

---

### 4. 📊 Property Comparison (Ready to Use)

**What it does:**
- Compare multiple saved properties side-by-side
- Shows risk scores, rent, per-person costs
- Highlights "Best Value" property
- Easy comparison table

**Features:**
- ✅ Side-by-side comparison
- ✅ Best value highlighting
- ✅ Risk score comparison
- ✅ Cost comparison
- ✅ Complaint/crime counts

---

## Integration

All features are integrated into the main results view:

1. **Budget Tracker** - Appears after risk breakdown
2. **Roommate Connector** - Next to budget tracker
3. **Shared Property List** - Inside roommate connector
4. **Budget in Saved Addresses** - Shows rent info if available

## Data Storage

- **Budget Data**: Stored per address in localStorage
- **Roommate Data**: Stored per address with share codes
- **Shared Properties**: Stored by share code
- **All data**: Persists across sessions

## Use Cases

### For Individual Students:
1. Enter budget to see if property is affordable
2. Calculate per-person costs
3. Save properties for later comparison

### For Roommate Groups:
1. Share property with roommates using code
2. Everyone votes and comments
3. See group approval rates
4. Compare budgets to find best fit
5. Make collaborative decisions

## Future Enhancements

- Real-time sync (Supabase Realtime)
- Email notifications for votes/comments
- Property comparison dashboard
- Budget recommendations based on income
- Roommate matching algorithm
- Group chat for properties

## Demo Tips for Hackathon

1. **Show Budget Tracker:**
   - Enter budget and rent
   - Show affordability analysis
   - Demonstrate per-person calculation

2. **Show Roommate Features:**
   - Generate share code
   - Add a roommate
   - Show shared property list
   - Vote and comment

3. **Highlight Collaboration:**
   - "Students can collaborate with roommates"
   - "Make group decisions together"
   - "Track budgets as a team"

## Technical Details

- **Storage**: localStorage (can upgrade to Supabase)
- **Share Codes**: Unique per property
- **Real-time**: Can be enhanced with WebSockets
- **Data Structure**: JSON-based, easy to migrate to database

