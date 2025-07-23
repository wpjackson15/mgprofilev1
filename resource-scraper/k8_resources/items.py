# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy


class K8ResourceItem(scrapy.Item):
    # define the fields for your item here like:
    # name = scrapy.Field()
    
    # Basic info
    name = scrapy.Field()
    description = scrapy.Field()
    url = scrapy.Field()
    source = scrapy.Field()
    
    # Categorization
    category = scrapy.Field()  # 'tutoring', 'cultural', 'mentorship', 'community', 'library'
    subcategory = scrapy.Field()  # 'math', 'reading', 'stem', 'arts', etc.
    tags = scrapy.Field()  # List of relevant tags
    
    # Age and grade targeting
    age_min = scrapy.Field()  # Minimum age (5 for K)
    age_max = scrapy.Field()  # Maximum age (14 for 8th grade)
    grade_min = scrapy.Field()  # 'K', '1', '2', etc.
    grade_max = scrapy.Field()  # '8'
    
    # Location
    location = scrapy.Field()
    address = scrapy.Field()
    city = scrapy.Field()
    state = scrapy.Field()
    zip_code = scrapy.Field()
    
    # Contact info
    phone = scrapy.Field()
    email = scrapy.Field()
    website = scrapy.Field()
    
    # Cost and availability
    cost_range = scrapy.Field()  # 'free', 'low_cost', 'moderate', 'high'
    cost_details = scrapy.Field()
    availability = scrapy.Field()  # 'ongoing', 'seasonal', 'limited'
    
    # Program details
    program_type = scrapy.Field()  # 'class', 'workshop', 'tutoring', 'mentorship', 'activity'
    schedule = scrapy.Field()
    duration = scrapy.Field()
    
    # Cultural/identity relevance
    cultural_focus = scrapy.Field()  # 'black_history', 'hispanic', 'asian', 'general'
    identity_support = scrapy.Field()  # 'racial_identity', 'cultural_pride', 'leadership'
    
    # Quality indicators
    reviews = scrapy.Field()
    rating = scrapy.Field()
    accreditation = scrapy.Field()
    
    # Metadata
    scraped_at = scrapy.Field()
    last_updated = scrapy.Field()
