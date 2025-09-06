import { Resource } from '@/hooks/useResourceMatches';
import fs from 'fs';
import path from 'path';

interface CachedResources {
  city: string;
  state: string;
  resources: Resource[];
  scrapedAt: string;
  expiresAt: string;
}

const CACHE_DIR = path.join(process.cwd(), 'public', 'resource-cache');
const CACHE_EXPIRY_DAYS = 30; // Resources expire after 30 days

// Ensure cache directory exists
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

// Generate cache filename from city/state
function getCacheFilename(city: string, state: string): string {
  const normalizedCity = city.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const normalizedState = state.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${normalizedCity}_${normalizedState}.json`;
}

// Check if cache exists and is valid
export function getCachedResources(city: string, state: string): Resource[] | null {
  try {
    ensureCacheDir();
    const filename = getCacheFilename(city, state);
    const filepath = path.join(CACHE_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return null;
    }
    
    const cached: CachedResources = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    const now = new Date();
    const expiresAt = new Date(cached.expiresAt);
    
    if (now > expiresAt) {
      // Cache expired, delete file
      fs.unlinkSync(filepath);
      return null;
    }
    
    return cached.resources;
  } catch (error) {
    console.error('Error reading cached resources:', error);
    return null;
  }
}

// Save resources to cache
export function saveCachedResources(city: string, state: string, resources: Resource[]): void {
  try {
    ensureCacheDir();
    const filename = getCacheFilename(city, state);
    const filepath = path.join(CACHE_DIR, filename);
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
    
    const cached: CachedResources = {
      city,
      state,
      resources,
      scrapedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };
    
    fs.writeFileSync(filepath, JSON.stringify(cached, null, 2));
    console.log(`Cached ${resources.length} resources for ${city}, ${state}`);
  } catch (error) {
    console.error('Error saving cached resources:', error);
  }
}

// Get cache status for a city
export function getCacheStatus(city: string, state: string): { exists: boolean; expiresAt?: string; resourceCount?: number } {
  try {
    ensureCacheDir();
    const filename = getCacheFilename(city, state);
    const filepath = path.join(CACHE_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return { exists: false };
    }
    
    const cached: CachedResources = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    const now = new Date();
    const expiresAt = new Date(cached.expiresAt);
    
    if (now > expiresAt) {
      return { exists: false };
    }
    
    return {
      exists: true,
      expiresAt: cached.expiresAt,
      resourceCount: cached.resources.length
    };
  } catch (error) {
    console.error('Error checking cache status:', error);
    return { exists: false };
  }
}

// List all cached cities
export function listCachedCities(): Array<{ city: string; state: string; resourceCount: number; scrapedAt: string; expiresAt: string }> {
  try {
    ensureCacheDir();
    const files = fs.readdirSync(CACHE_DIR);
    const cities: Array<{ city: string; state: string; resourceCount: number; scrapedAt: string; expiresAt: string }> = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filepath = path.join(CACHE_DIR, file);
          const cached: CachedResources = JSON.parse(fs.readFileSync(filepath, 'utf8'));
          const now = new Date();
          const expiresAt = new Date(cached.expiresAt);
          
          // Only include non-expired caches
          if (now <= expiresAt) {
            cities.push({
              city: cached.city,
              state: cached.state,
              resourceCount: cached.resources.length,
              scrapedAt: cached.scrapedAt,
              expiresAt: cached.expiresAt
            });
          }
        } catch (error) {
          console.error(`Error reading cache file ${file}:`, error);
        }
      }
    }
    
    return cities.sort((a, b) => new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime());
  } catch (error) {
    console.error('Error listing cached cities:', error);
    return [];
  }
}

// Clear expired caches
export function clearExpiredCaches(): number {
  try {
    ensureCacheDir();
    const files = fs.readdirSync(CACHE_DIR);
    let clearedCount = 0;
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filepath = path.join(CACHE_DIR, file);
          const cached: CachedResources = JSON.parse(fs.readFileSync(filepath, 'utf8'));
          const now = new Date();
          const expiresAt = new Date(cached.expiresAt);
          
          if (now > expiresAt) {
            fs.unlinkSync(filepath);
            clearedCount++;
          }
        } catch (error) {
          console.error(`Error processing cache file ${file}:`, error);
        }
      }
    }
    
    return clearedCount;
  } catch (error) {
    console.error('Error clearing expired caches:', error);
    return 0;
  }
}
