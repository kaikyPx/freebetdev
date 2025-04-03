
import { useState, useEffect } from 'react';
import { authService } from '../services/supabaseService';

export const useCurrentUser = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = () => {
      const { valid, user } = authService.verifyToken();
      if (valid && user) {
        setUserId(user.id);
      }
      setIsLoading(false);
    };

    checkUser();
  }, []);

  return { userId, isLoading };
};