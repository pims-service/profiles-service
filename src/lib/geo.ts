// Localized geo-registry dictionary for lightning-fast coordinate matching of zip codes and cities
export interface GeoLocation {
  name: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
}

const geoRegistry: Record<string, GeoLocation> = {
  // Zip Codes
  "10005": { name: "New York, NY", lat: 40.7078, lng: -74.0115, city: "New York", state: "NY" },
  "10001": { name: "New York, NY", lat: 40.7128, lng: -74.0060, city: "New York", state: "NY" },
  "10010": { name: "New York, NY", lat: 40.7415, lng: -73.9902, city: "New York", state: "NY" },
  "90211": { name: "Beverly Hills, CA", lat: 34.0664, lng: -118.3725, city: "Beverly Hills", state: "CA" },
  "90210": { name: "Beverly Hills, CA", lat: 34.0736, lng: -118.4004, city: "Beverly Hills", state: "CA" },
  "77004": { name: "Houston, TX", lat: 29.7248, lng: -95.3892, city: "Houston", state: "TX" },
  "77002": { name: "Houston, TX", lat: 29.7604, lng: -95.3698, city: "Houston", state: "TX" },
  "02116": { name: "Boston, MA", lat: 42.3524, lng: -71.0715, city: "Boston", state: "MA" },
  "02108": { name: "Boston, MA", lat: 42.3601, lng: -71.0589, city: "Boston", state: "MA" },
  "60601": { name: "Chicago, IL", lat: 41.8845, lng: -87.6248, city: "Chicago", state: "IL" },
  "60611": { name: "Chicago, IL", lat: 41.8923, lng: -87.6218, city: "Chicago", state: "IL" },
  "33131": { name: "Miami, FL", lat: 25.7645, lng: -80.1920, city: "Miami", state: "FL" },
  "98101": { name: "Seattle, WA", lat: 47.6138, lng: -122.3302, city: "Seattle", state: "WA" },
  "78701": { name: "Austin, TX", lat: 30.2691, lng: -97.7402, city: "Austin", state: "TX" },
  "94111": { name: "San Francisco, CA", lat: 37.7925, lng: -122.4002, city: "San Francisco", state: "CA" },
  "32801": { name: "Orlando, FL", lat: 28.5383, lng: -81.3792, city: "Orlando", state: "FL" },
  // Pakistani Cities
  "74200": { name: "Karachi, PK", lat: 24.8607, lng: 67.0011, city: "Karachi", state: "Sindh" },
  "54000": { name: "Lahore, PK", lat: 31.5204, lng: 74.3587, city: "Lahore", state: "Punjab" },
  "44000": { name: "Islamabad, PK", lat: 33.6844, lng: 73.0479, city: "Islamabad", state: "ICT" },
  "46000": { name: "Rawalpindi, PK", lat: 33.5651, lng: 73.0169, city: "Rawalpindi", state: "Punjab" },
  "25000": { name: "Peshawar, PK", lat: 34.0151, lng: 71.5249, city: "Peshawar", state: "KPK" },
  "87300": { name: "Quetta, PK", lat: 30.1798, lng: 66.9750, city: "Quetta", state: "Balochistan" },
};

// Map of lowercased city names to coordinates
const cityRegistry: Record<string, GeoLocation> = {};
Object.entries(geoRegistry).forEach(([zip, loc]) => {
  cityRegistry[loc.city.toLowerCase()] = loc;
});

/**
 * Resolves a search string (zip code or city name) to a GeoLocation object.
 */
export function resolveLocation(query: string): GeoLocation | null {
  const trimmed = query.trim().toLowerCase();
  
  // 1. Try ZIP matching
  if (geoRegistry[trimmed]) {
    return geoRegistry[trimmed];
  }

  // 2. Try exact city matching
  if (cityRegistry[trimmed]) {
    return cityRegistry[trimmed];
  }

  // 3. Try partial city matching
  const matchingKey = Object.keys(cityRegistry).find(key => key.includes(trimmed) || trimmed.includes(key));
  if (matchingKey) {
    return cityRegistry[matchingKey];
  }

  return null;
}

/**
 * Calculates distance between two coordinates in miles using the Haversine formula.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in miles
}
