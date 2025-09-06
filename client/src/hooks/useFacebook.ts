import { useEffect, useState } from 'react';
import { initFacebookSDK } from '@/lib/facebook';

export function useFacebook() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFB = async () => {
      try {
        await initFacebookSDK();
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load Facebook SDK:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFB();
  }, []);

  return { isLoaded, isLoading };
}