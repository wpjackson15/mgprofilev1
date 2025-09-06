import { NextRequest, NextResponse } from 'next/server';
import { getCachedResources, saveCachedResources, getCacheStatus } from '@/services/resourceCache';
import { connectToMongoDB } from '@/services/mongodb';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { city, state } = await request.json();
    
    if (!city || !state) {
      return NextResponse.json(
        { error: 'City and state are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectToMongoDB();

    // Check if we already have cached resources for this city
    const cachedResources = await getCachedResources(city, state);
    if (cachedResources) {
      console.log(`Returning ${cachedResources.length} cached resources for ${city}, ${state}`);
      return NextResponse.json({
        success: true,
        resources: cachedResources,
        cached: true,
        message: `Found ${cachedResources.length} cached resources for ${city}, ${state}`
      });
    }

    // No cache found, need to scrape
    console.log(`No cache found for ${city}, ${state}. Starting scrape...`);
    
    // Run the Python scraper for this specific city
    const scraperPath = path.join(process.cwd(), 'resource-scraper');
    
    // Create a temporary script to scrape just this city
    const tempScript = `
import sys
import os
sys.path.append('${scraperPath}')

from k8_resources.spiders.community_resources import CommunityResourcesSpider
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
import json

# Override settings for single city scraping
settings = get_project_settings()
settings.set('FEEDS', {
    'temp_results.json': {
        'format': 'json',
        'overwrite': True,
    },
})

# Create spider instance with specific city
spider = CommunityResourcesSpider()
spider.start_urls = [f"https://www.google.com/search?q={city}+{state}+K-8+community+resources"]

process = CrawlerProcess(settings)
process.crawl(spider)
process.start()

# Read results and output
try:
    with open('temp_results.json', 'r') as f:
        results = json.load(f)
    print(json.dumps(results))
    os.remove('temp_results.json')
except:
    print('[]')
`;

    // Write temporary script
    const tempScriptPath = path.join(scraperPath, 'temp_scrape.py');
    fs.writeFileSync(tempScriptPath, tempScript);

    // Run the scraper
    const scrapePromise = new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [tempScriptPath], {
        cwd: scraperPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        // Clean up temp script
        try {
          fs.unlinkSync(tempScriptPath);
        } catch (error) {
          console.warn('Could not delete temp script:', error);
        }

        if (code === 0) {
          try {
            const results = JSON.parse(output);
            resolve(results);
          } catch (e) {
            reject(new Error('Failed to parse scraper output: ' + output));
          }
        } else {
          reject(new Error(`Scraper failed with code ${code}: ${errorOutput}`));
        }
      });
    });

    // Wait for scraping to complete (with timeout)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Scraping timeout')), 60000); // 60 second timeout
    });

    const scrapedResources = await Promise.race([scrapePromise, timeoutPromise]) as Resource[];

    // Process and save the scraped resources
    const processedResources = scrapedResources.map((resource: Resource) => ({
      ...resource,
      city: city,
      state: state,
      scraped_at: new Date().toISOString()
    }));

    // Save to cache
    await saveCachedResources(city, state, processedResources);

    return NextResponse.json({
      success: true,
      resources: processedResources,
      cached: false,
      message: `Scraped ${processedResources.length} new resources for ${city}, ${state}`
    });

  } catch (error: any) {
    console.error('Error in resource scraping:', error);
    return NextResponse.json(
      { 
        error: 'Failed to scrape resources',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const state = searchParams.get('state');

    if (!city || !state) {
      return NextResponse.json(
        { error: 'City and state are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectToMongoDB();

    // Check cache status
    const cacheStatus = await getCacheStatus(city, state);
    const cachedResources = await getCachedResources(city, state);

    return NextResponse.json({
      success: true,
      cacheStatus,
      resources: cachedResources || [],
      hasCache: cacheStatus.exists
    });

  } catch (error: any) {
    console.error('Error checking resource cache:', error);
    return NextResponse.json(
      { error: 'Failed to check resource cache' },
      { status: 500 }
    );
  }
}
