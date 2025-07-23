import scrapy
import re
from datetime import datetime
from k8_resources.items import K8ResourceItem


class CommunityResourcesSpider(scrapy.Spider):
    name = "community_resources"
    
    # Target major cities for K-8 resources
    cities = [
        "Atlanta", "Chicago", "New York", "Los Angeles", "Houston",
        "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas"
    ]
    
    def start_requests(self):
        """Start with search queries for each city"""
        for city in self.cities:
            # Search for various types of K-8 resources
            searches = [
                f"{city} K-8 tutoring programs",
                f"{city} children's library programs",
                f"{city} youth mentorship programs",
                f"{city} cultural programs for kids",
                f"{city} after school programs",
                f"{city} community center youth programs"
            ]
            
            for search in searches:
                yield scrapy.Request(
                    url=f"https://www.google.com/search?q={search.replace(' ', '+')}",
                    callback=self.parse_search_results,
                    meta={'city': city, 'search_type': search}
                )

    def parse_search_results(self, response):
        """Parse Google search results to find resource websites"""
        # Extract links from search results
        links = response.css('a[href^="http"]::attr(href)').getall()
        
        for link in links:
            # Filter for relevant domains
            if self.is_relevant_domain(link):
                yield scrapy.Request(
                    url=link,
                    callback=self.parse_resource_site,
                    meta={'city': response.meta['city']}
                )

    def is_relevant_domain(self, url):
        """Check if URL is from a relevant domain"""
        relevant_domains = [
            'library', 'community', 'youth', 'kids', 'children',
            'tutoring', 'mentorship', 'cultural', 'education',
            'city.gov', 'county.gov', 'parks', 'recreation'
        ]
        
        url_lower = url.lower()
        return any(domain in url_lower for domain in relevant_domains)

    def parse_resource_site(self, response):
        """Parse individual resource websites"""
        # Look for program listings, services, or resource pages
        program_links = response.css('a[href*="program"], a[href*="service"], a[href*="class"], a[href*="activity"]::attr(href)').getall()
        
        for link in program_links:
            if link.startswith('/'):
                link = response.urljoin(link)
            yield scrapy.Request(
                url=link,
                callback=self.parse_resource_detail,
                meta={'city': response.meta['city'], 'source_site': response.url}
            )

    def parse_resource_detail(self, response):
        """Parse individual resource/program details"""
        item = K8ResourceItem()
        
        # Basic info
        item['name'] = self.extract_name(response)
        item['description'] = self.extract_description(response)
        item['url'] = response.url
        item['source'] = response.meta.get('source_site', response.url)
        item['scraped_at'] = datetime.now().isoformat()
        
        # Categorization
        item['category'] = self.determine_category(response)
        item['subcategory'] = self.extract_subcategory(response)
        item['tags'] = self.extract_tags(response)
        
        # Age/grade targeting
        age_info = self.extract_age_info(response)
        item['age_min'] = age_info.get('min')
        item['age_max'] = age_info.get('max')
        item['grade_min'] = age_info.get('grade_min')
        item['grade_max'] = age_info.get('grade_max')
        
        # Location
        location_info = self.extract_location(response)
        item['location'] = location_info.get('name')
        item['address'] = location_info.get('address')
        item['city'] = location_info.get('city')
        item['state'] = location_info.get('state')
        item['zip_code'] = location_info.get('zip')
        
        # Contact info
        item['phone'] = self.extract_phone(response)
        item['email'] = self.extract_email(response)
        item['website'] = self.extract_website(response)
        
        # Cost and availability
        item['cost_range'] = self.determine_cost_range(response)
        item['cost_details'] = self.extract_cost_details(response)
        item['availability'] = self.extract_availability(response)
        
        # Program details
        item['program_type'] = self.determine_program_type(response)
        item['schedule'] = self.extract_schedule(response)
        item['duration'] = self.extract_duration(response)
        
        # Cultural relevance
        item['cultural_focus'] = self.determine_cultural_focus(response)
        item['identity_support'] = self.extract_identity_support(response)
        
        # Quality indicators
        item['reviews'] = self.extract_reviews(response)
        item['rating'] = self.extract_rating(response)
        item['accreditation'] = self.extract_accreditation(response)
        
        # Only yield if it's relevant for K-8
        if self.is_k8_relevant(item):
            yield item

    def extract_name(self, response):
        """Extract resource name"""
        selectors = [
            'h1::text',
            '.title::text',
            '.program-name::text',
            'h2::text',
            'title::text'
        ]
        
        for selector in selectors:
            name = response.css(selector).get()
            if name:
                return name.strip()
        return None

    def extract_description(self, response):
        """Extract resource description"""
        selectors = [
            '.description::text',
            '.program-description::text',
            '.content p::text',
            'p::text'
        ]
        
        for selector in selectors:
            desc = response.css(selector).get()
            if desc and len(desc.strip()) > 20:
                return desc.strip()
        return None

    def determine_category(self, response):
        """Determine the main category"""
        text = response.text.lower()
        
        if any(word in text for word in ['tutor', 'academic', 'homework']):
            return 'tutoring'
        elif any(word in text for word in ['cultural', 'heritage', 'ethnic']):
            return 'cultural'
        elif any(word in text for word in ['mentor', 'leadership', 'role model']):
            return 'mentorship'
        elif any(word in text for word in ['library', 'reading', 'book']):
            return 'library'
        else:
            return 'community'

    def extract_age_info(self, response):
        """Extract age and grade information"""
        text = response.text.lower()
        
        # Look for age patterns
        age_patterns = [
            r'ages?\s*(\d+)[-\s]*(\d+)',
            r'(\d+)[-\s]*(\d+)\s*years?\s*old',
            r'grades?\s*([k1-8])[-\s]*([1-8])',
            r'([k1-8])[-\s]*([1-8])\s*grade'
        ]
        
        for pattern in age_patterns:
            match = re.search(pattern, text)
            if match:
                if 'grade' in pattern:
                    return {
                        'grade_min': match.group(1),
                        'grade_max': match.group(2),
                        'min': self.grade_to_age(match.group(1)),
                        'max': self.grade_to_age(match.group(2))
                    }
                else:
                    return {
                        'min': int(match.group(1)),
                        'max': int(match.group(2)),
                        'grade_min': self.age_to_grade(int(match.group(1))),
                        'grade_max': self.age_to_grade(int(match.group(2)))
                    }
        
        return {'min': None, 'max': None, 'grade_min': None, 'grade_max': None}

    def grade_to_age(self, grade):
        """Convert grade to approximate age"""
        if grade.lower() == 'k':
            return 5
        return int(grade) + 5

    def age_to_grade(self, age):
        """Convert age to approximate grade"""
        if age == 5:
            return 'K'
        return str(age - 5)

    def extract_location(self, response):
        """Extract location information"""
        # This is a simplified version - would need more sophisticated parsing
        return {
            'name': None,
            'address': None,
            'city': None,
            'state': None,
            'zip': None
        }

    def extract_phone(self, response):
        """Extract phone number"""
        phone_pattern = r'\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}'
        match = re.search(phone_pattern, response.text)
        return match.group() if match else None

    def extract_email(self, response):
        """Extract email address"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(email_pattern, response.text)
        return match.group() if match else None

    def determine_cost_range(self, response):
        """Determine cost range"""
        text = response.text.lower()
        
        if any(word in text for word in ['free', 'no cost', 'complimentary']):
            return 'free'
        elif any(word in text for word in ['low cost', 'affordable', 'sliding scale']):
            return 'low_cost'
        elif any(word in text for word in ['expensive', 'premium', 'high cost']):
            return 'high'
        else:
            return 'moderate'

    def is_k8_relevant(self, item):
        """Check if resource is relevant for K-8 students"""
        # Must have age/grade info and be within K-8 range
        if item['age_min'] and item['age_max']:
            return 5 <= item['age_min'] <= 14 and 5 <= item['age_max'] <= 14
        
        # Or have grade info
        if item['grade_min'] and item['grade_max']:
            grades = ['K', '1', '2', '3', '4', '5', '6', '7', '8']
            return item['grade_min'] in grades and item['grade_max'] in grades
        
        # If no age/grade info, assume it's relevant if it has a name and description
        return bool(item['name'] and item['description'])

    # Placeholder methods for other extractions
    def extract_subcategory(self, response):
        return None

    def extract_tags(self, response):
        return []

    def extract_website(self, response):
        return None

    def extract_cost_details(self, response):
        return None

    def extract_availability(self, response):
        return 'ongoing'

    def determine_program_type(self, response):
        return 'activity'

    def extract_schedule(self, response):
        return None

    def extract_duration(self, response):
        return None

    def determine_cultural_focus(self, response):
        return 'general'

    def extract_identity_support(self, response):
        return []

    def extract_reviews(self, response):
        return None

    def extract_rating(self, response):
        return None

    def extract_accreditation(self, response):
        return None
