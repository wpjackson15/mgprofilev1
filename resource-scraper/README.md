# K-8 Community Resources Scraper

A Scrapy-based web scraper for discovering local community resources relevant to K-8 students and their families.

## 🎯 Purpose

This scraper is designed to find and catalog:
- **Tutoring services** and academic support programs
- **Cultural organizations** and heritage programs  
- **Mentorship programs** and leadership development
- **Community centers** and after-school programs
- **Library programs** and reading initiatives

## 🚀 Quick Start

### 1. Setup Environment
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Run the Spider
```bash
# Run the community resources spider
scrapy crawl community_resources

# Or use the test script
python test_spider.py
```

### 3. View Results
Results are automatically saved to JSON format and can be imported into your main application database.

## 🕷️ Spider Features

### **CommunityResourcesSpider**
- **Targets major cities** (Atlanta, Chicago, NYC, LA, Houston, etc.)
- **Searches multiple resource types** (tutoring, cultural, mentorship, etc.)
- **Extracts comprehensive data** including:
  - Basic info (name, description, URL)
  - Age/grade targeting (K-8 specific)
  - Location and contact information
  - Cost and availability details
  - Cultural relevance indicators
  - Quality metrics

### **Data Structure**
Each resource includes:
- **Categorization**: tutoring, cultural, mentorship, library, community
- **Age targeting**: 5-14 years (K-8 grades)
- **Location data**: city, state, zip code
- **Cost information**: free, low_cost, moderate, high
- **Cultural focus**: black_history, hispanic, asian, general
- **Quality indicators**: reviews, ratings, accreditation

## 🔧 Configuration

### Target Cities
Edit `cities` list in `community_resources.py`:
```python
cities = [
    "Atlanta", "Chicago", "New York", "Los Angeles", "Houston",
    "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas"
]
```

### Search Types
Modify `searches` list to target different resource types:
```python
searches = [
    f"{city} K-8 tutoring programs",
    f"{city} children's library programs",
    f"{city} youth mentorship programs",
    # Add more search types...
]
```

## 📊 Output Format

Resources are saved as JSON with the following structure:
```json
{
  "name": "Program Name",
  "description": "Program description...",
  "category": "tutoring",
  "age_min": 8,
  "age_max": 12,
  "grade_min": "3",
  "grade_max": "6",
  "location": "Community Center",
  "city": "Atlanta",
  "state": "GA",
  "zip_code": "30301",
  "cost_range": "low_cost",
  "cultural_focus": "black_history",
  "url": "https://example.com/program",
  "scraped_at": "2024-01-15T10:30:00"
}
```

## 🔗 Integration

This scraper is designed to work with your "My Genius Profile" application:

1. **Run periodically** to discover new resources
2. **Import data** into your PostgreSQL database
3. **Match resources** to user profiles based on:
   - Interest awareness module
   - Racial identity module
   - Can-do attitude module
   - Location and age preferences

## 🚧 Future Enhancements

- **Event discovery** for time-sensitive programs
- **Automated email notifications** for new relevant resources
- **Advanced matching algorithms** using profile data
- **Quality scoring** based on reviews and ratings
- **Geographic clustering** for location-based recommendations

## 📝 Notes

- **Respect robots.txt** - The spider automatically respects website crawling policies
- **Rate limiting** - Built-in delays to avoid overwhelming target sites
- **Error handling** - Graceful handling of missing data and parsing errors
- **K-8 focus** - Only resources relevant to K-8 students are collected 