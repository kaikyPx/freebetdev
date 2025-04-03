// hooks/useSupabaseUser.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Ajuste o caminho conforme necessário

export function useSupabaseUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obter usuário atual
    const getCurrentUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Erro ao obter usuário:', error);
      } else {
        setUser(user);
      }
      
      setLoading(false);
    };

    getCurrentUser();

    // Configurar listener para mudanças na autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}