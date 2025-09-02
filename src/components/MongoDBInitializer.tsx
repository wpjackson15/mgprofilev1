'use client';

import { useEffect } from 'react';
import { connectToMongoDB } from '@/services/mongodb';

export default function MongoDBInitializer() {
  useEffect(() => {
    // Initialize MongoDB connection when the app starts
    const initMongoDB = async () => {
      try {
        await connectToMongoDB();
        console.log('MongoDB connected successfully');
      } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
      }
    };

    initMongoDB();
  }, []);

  // This component doesn't render anything
  return null;
}
