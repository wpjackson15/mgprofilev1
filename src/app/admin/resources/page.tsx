"use client";

import React, { useState, useEffect } from "react";
import { listCachedCities, clearExpiredCaches } from "@/services/resourceCache";

interface CachedCity {
  city: string;
  state: string;
  resourceCount: number;
  scrapedAt: string;
  expiresAt: string;
}

export default function ResourceCacheAdmin() {
  const [cachedCities, setCachedCities] = useState<CachedCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const loadCachedCities = async () => {
    try {
      setLoading(true);
      const cities = await listCachedCities();
      setCachedCities(cities);
    } catch (error) {
      console.error("Error loading cached cities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearExpired = async () => {
    try {
      setClearing(true);
      const clearedCount = await clearExpiredCaches();
      await loadCachedCities();
      alert(`Cleared ${clearedCount} expired cache entries`);
    } catch (error) {
      console.error("Error clearing expired caches:", error);
      alert("Error clearing expired caches");
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    loadCachedCities();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry < 7; // Expiring within 7 days
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Resource Cache Management</h1>
              <div className="flex space-x-3">
                <button
                  onClick={loadCachedCities}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Refresh"}
                </button>
                <button
                  onClick={handleClearExpired}
                  disabled={clearing}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {clearing ? "Clearing..." : "Clear Expired"}
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Manage cached resources for different cities. Resources are automatically scraped on-demand and cached for 30 days.
            </p>
          </div>

          <div className="px-6 py-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading cached cities...</p>
              </div>
            ) : cachedCities.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">📁</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Cached Resources</h3>
                <p className="text-gray-600">
                  No cities have been scraped yet. Resources will be cached automatically when users request them.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        City
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resources
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scraped
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expires
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cachedCities.map((city, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {city.city}, {city.state}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {city.resourceCount} resources
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(city.scrapedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${isExpiringSoon(city.expiresAt) ? 'text-orange-600' : 'text-gray-900'}`}>
                            {formatDate(city.expiresAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            isExpiringSoon(city.expiresAt)
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {isExpiringSoon(city.expiresAt) ? 'Expiring Soon' : 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <h4 className="font-medium text-gray-900 mb-2">How it works:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Users request resources for their city/grade</li>
                <li>System checks cache first - if found, returns immediately</li>
                <li>If not cached, runs scraper for that specific city</li>
                <li>Results are cached for 30 days for future users</li>
                <li>Cache entries are stored in MongoDB <code className="bg-gray-200 px-1 rounded">resourceCache</code> collection</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
