import { useEffect, useState } from "react";

export interface Resource {
  name: string;
  description: string | null;
  url: string;
  source: string;
  scraped_at: string;
  category: string;
  subcategory: string | null;
  tags: string[];
  age_min: number;
  age_max: number;
  grade_min: string;
  grade_max: string;
  location: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  cost_range: string | null;
  cost_details: string | null;
  availability: string | null;
  program_type: string | null;
  schedule: string | null;
  duration: string | null;
  cultural_focus: string | null;
  identity_support: string[];
  reviews: string | null;
  rating: string | null;
  accreditation: string | null;
}

export function useResourceMatches(city?: string, state?: string) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);

  // Function to fetch resources for a specific city
  const fetchResourcesForCity = async (cityName: string, stateName: string) => {
    setLoading(true);
    setError(null);
    setIsScraping(false);

    try {
      const response = await fetch('/api/v2/resources/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          city: cityName,
          state: stateName
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch resources');
      }

      setResources(data.resources);
      
      if (!data.cached) {
        setIsScraping(true);
        // Hide scraping indicator after a short delay
        setTimeout(() => setIsScraping(false), 2000);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load resources');
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  // Load default resources if no city/state specified
  useEffect(() => {
    if (!city || !state) {
      setLoading(true);
      fetch("/improved_results.json")
        .then((res) => res.json())
        .then((data) => {
          setResources(data);
          setLoading(false);
        })
        .catch(() => {
          setError("Failed to load default resources");
          setLoading(false);
        });
    }
  }, [city, state]);

  return { 
    resources, 
    loading, 
    error, 
    isScraping,
    fetchResourcesForCity 
  };
} 