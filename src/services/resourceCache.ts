import { 
  getCachedResources as getMongoCachedResources,
  saveCachedResources as saveMongoCachedResources,
  getCacheStatus as getMongoCacheStatus,
  listCachedCities as listMongoCachedCities,
  clearExpiredCaches as clearMongoExpiredCaches,
  Resource
} from './mongodb';

// MongoDB-based resource caching functions
export async function getCachedResources(city: string, state: string): Promise<Resource[] | null> {
  try {
    return await getMongoCachedResources(city, state);
  } catch (error) {
    console.error('Error reading cached resources from MongoDB:', error);
    return null;
  }
}

export async function saveCachedResources(city: string, state: string, resources: Resource[]): Promise<void> {
  try {
    await saveMongoCachedResources(city, state, resources);
    console.log(`Cached ${resources.length} resources for ${city}, ${state} in MongoDB`);
  } catch (error) {
    console.error('Error saving cached resources to MongoDB:', error);
  }
}

export async function getCacheStatus(city: string, state: string): Promise<{ exists: boolean; expiresAt?: string; resourceCount?: number }> {
  try {
    return await getMongoCacheStatus(city, state);
  } catch (error) {
    console.error('Error checking cache status in MongoDB:', error);
    return { exists: false };
  }
}

export async function listCachedCities(): Promise<Array<{ city: string; state: string; resourceCount: number; scrapedAt: string; expiresAt: string }>> {
  try {
    return await listMongoCachedCities();
  } catch (error) {
    console.error('Error listing cached cities from MongoDB:', error);
    return [];
  }
}

export async function clearExpiredCaches(): Promise<number> {
  try {
    return await clearMongoExpiredCaches();
  } catch (error) {
    console.error('Error clearing expired caches in MongoDB:', error);
    return 0;
  }
}
