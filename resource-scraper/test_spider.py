#!/usr/bin/env python3
"""
Test script for the K-8 Community Resources Spider
"""

import json
import os
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from k8_resources.spiders.community_resources import CommunityResourcesSpider

def test_spider():
    """Run the spider and save results to JSON"""
    
    # Set up the crawler process
    process = CrawlerProcess(get_project_settings())
    
    # Add the spider to the process
    process.crawl(CommunityResourcesSpider)
    
    # Run the spider
    process.start()
    
    print("Spider completed!")

if __name__ == "__main__":
    test_spider() 