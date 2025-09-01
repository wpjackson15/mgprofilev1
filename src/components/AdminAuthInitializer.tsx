"use client";
import { useEffect } from 'react';
import { initializeAdminAuth } from '@/lib/adminAuth';

export default function AdminAuthInitializer() {
  useEffect(() => {
    initializeAdminAuth();
  }, []);

  return null; // This component doesn't render anything
}
