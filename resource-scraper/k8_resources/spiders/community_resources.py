import scrapy
import re
from datetime import datetime
from k8_resources.items import K8ResourceItem


class CommunityResourcesSpider(scrapy.Spider):
    name = "community_resources"
    
    # Target specific resource websites directly
    start_urls = [
        # Library systems
        "https://www.nypl.org/events/programs/kids",
        "https://www.chipublib.org/programs-and-partnerships/programs/",
        "https://www.lapl.org/kids",
        "https://www.houstonlibrary.org/kids",
        "https://www.phila.gov/programs/",
        
        # Community centers
        "https://www.ymca.org/programs",
        "https://www.boysandgirlsclubs.org/programs",
        "https://www.girlscouts.org/en/programs.html",
        "https://www.scouting.org/programs/",
        
        # Cultural organizations
        "https://www.naacp.org/programs/",
        "https://www.urbanleague.org/programs/",
        "https://www.nationalmuseumofafricanamericanhistoryandculture.si.edu/",
        
        # Tutoring services
        "https://www.kumon.com/",
        "https://www.mathnasium.com/",
        "https://www.sylvanlearning.com/",
        "https://www.huntingtonlearning.com/",
        
        # Educational resources
        "https://www.khanacademy.org/",
        "https://www.pbs.org/parents/",
        "https://www.scholastic.com/parents/",
    ]
    
    def parse(self, response):
        """Parse resource websites to find K-8 programs"""
        
        # Extract program links
        program_links = response.css('a[href*="program"], a[href*="class"], a[href*="activity"], a[href*="kids"], a[href*="youth"]::attr(href)').getall()
        
        for link in program_links:
            if link.startswith('/'):
                link = response.urljoin(link)
            elif not link.startswith('http'):
                continue
                
            yield scrapy.Request(
                url=link,
                callback=self.parse_resource_detail,
                meta={'source_site': response.url}
            )
        
        # Also look for program information on the current page
        if self.has_program_content(response):
            yield self.extract_resource_from_page(response)

    def has_program_content(self, response):
        """Check if page contains program information"""
        text = response.text.lower()
        program_keywords = [
            'program', 'class', 'activity', 'workshop', 'tutoring',
            'mentorship', 'after school', 'summer camp', 'enrichment'
        ]
        return any(keyword in text for keyword in program_keywords)

    def extract_resource_from_page(self, response):
        """Extract resource information from the current page"""
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
        
        return item

    def parse_resource_detail(self, response):
        """Parse individual resource/program details"""
        return self.extract_resource_from_page(response)

    def extract_name(self, response):
        """Extract resource name"""
        selectors = [
            'h1::text',
            '.title::text',
            '.program-name::text',
            'h2::text',
            'title::text',
            '.hero-title::text',
            '.main-title::text',
            '[class*="title"]::text',
            '[class*="heading"]::text'
        ]
        
        for selector in selectors:
            name = response.css(selector).get()
            if name:
                name = name.strip()
                # Filter out generic names
                if name and len(name) > 3 and name.lower() not in ['home', 'about', 'contact', 'programs', 'services']:
                    return name
        return None

    def extract_description(self, response):
        """Extract resource description"""
        selectors = [
            '.description::text',
            '.program-description::text',
            '.content p::text',
            '.hero-description::text',
            '.main-content p::text',
            '[class*="description"]::text',
            '[class*="content"] p::text',
            'p::text'
        ]
        
        descriptions = []
        for selector in selectors:
            descs = response.css(selector).getall()
            for desc in descs:
                desc = desc.strip()
                if desc and len(desc) > 20 and len(desc) < 500:
                    descriptions.append(desc)
        
        # Return the best description
        if descriptions:
            # Prefer descriptions with program-related keywords
            program_keywords = ['program', 'class', 'activity', 'learn', 'teach', 'help', 'support', 'youth', 'child']
            for desc in descriptions:
                if any(keyword in desc.lower() for keyword in program_keywords):
                    return desc
            return descriptions[0]
        return None

    def determine_category(self, response):
        """Determine the main category"""
        text = response.text.lower()
        url = response.url.lower()
        
        # More specific category detection
        if any(word in text or word in url for word in ['tutor', 'academic', 'homework', 'kumon', 'mathnasium', 'sylvan', 'huntington', 'learning center']):
            return 'tutoring'
        elif any(word in text or word in url for word in ['cultural', 'heritage', 'ethnic', 'naacp', 'urban league', 'museum', 'african american', 'black history']):
            return 'cultural'
        elif any(word in text or word in url for word in ['mentor', 'leadership', 'role model', 'scouting', 'girl scouts', 'boys and girls', 'big brothers', 'big sisters']):
            return 'mentorship'
        elif any(word in text or word in url for word in ['library', 'reading', 'book', 'nypl', 'chipublib', 'lapl', 'houstonlibrary']):
            return 'library'
        elif any(word in text or word in url for word in ['ymca', 'boys and girls', 'community center', 'recreation', 'parks']):
            return 'community'
        elif any(word in text or word in url for word in ['after school', 'summer camp', 'enrichment', 'extracurricular']):
            return 'enrichment'
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
        
        # Default to K-8 if no specific age found
        return {'min': 5, 'max': 14, 'grade_min': 'K', 'grade_max': '8'}

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
        text = response.text
        
        # Look for address patterns
        address_patterns = [
            r'(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Place|Pl|Court|Ct|Way|Circle|Cir|Terrace|Ter))',
            r'([A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)',
            r'(\d+\s+[A-Za-z\s]+,\s*[A-Za-z\s]+,\s*[A-Z]{2})'
        ]
        
        for pattern in address_patterns:
            match = re.search(pattern, text)
            if match:
                address = match.group(1).strip()
                # Extract city and state
                city_state_match = re.search(r'([A-Za-z\s]+),\s*([A-Z]{2})', address)
                if city_state_match:
                    return {
                        'address': address,
                        'city': city_state_match.group(1).strip(),
                        'state': city_state_match.group(2),
                        'zip': None
                    }
                return {
                    'address': address,
                    'city': None,
                    'state': None,
                    'zip': None
                }
        
        return {
            'name': None,
            'address': None,
            'city': None,
            'state': None,
            'zip': None
        }

    def extract_phone(self, response):
        """Extract phone number"""
        # Look for phone numbers in various formats
        phone_patterns = [
            r'\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}',
            r'\d{3}[\s.-]?\d{3}[\s.-]?\d{4}',
            r'1[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{4}'
        ]
        
        for pattern in phone_patterns:
            matches = re.findall(pattern, response.text)
            for match in matches:
                # Clean up the phone number
                phone = re.sub(r'[^\d]', '', match)
                if len(phone) >= 10:
                    return phone
        return None

    def extract_email(self, response):
        """Extract email address"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        matches = re.findall(email_pattern, response.text)
        
        # Filter out common non-contact emails
        exclude_patterns = ['noreply', 'no-reply', 'donotreply', 'example', 'test']
        for match in matches:
            if not any(pattern in match.lower() for pattern in exclude_patterns):
                return match
        return None

    def determine_cost_range(self, response):
        """Determine cost range"""
        text = response.text.lower()
        
        # More sophisticated cost detection
        if any(word in text for word in ['free', 'no cost', 'complimentary', 'no charge', 'zero cost']):
            return 'free'
        elif any(word in text for word in ['low cost', 'affordable', 'sliding scale', 'scholarship', 'financial aid', 'reduced fee']):
            return 'low_cost'
        elif any(word in text for word in ['expensive', 'premium', 'high cost', 'luxury', 'exclusive']):
            return 'high'
        elif any(word in text for word in ['fee', 'cost', 'price', 'payment', 'tuition']):
            return 'moderate'
        else:
            return 'unknown'

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
