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

export function useResourceMatches() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/improved_results.json")
      .then((res) => res.json())
      .then((data) => {
        setResources(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load resources");
        setLoading(false);
      });
  }, []);

  return { resources, loading, error };
} 