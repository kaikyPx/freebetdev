import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente do Supabase não definidas!');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const SALT_ROUNDS = 10;

export const authService = {

  async login(email: string, password: string) {
    try {
      // Verificar se o email existe
      const { data, error } = await supabase
        .from('users')
        .select('id, email, encrypted_password')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Erro ao buscar usuário:', error);
        return { success: false, message: error.code === 'PGRST116' ? 'Email não encontrado' : 'Erro ao verificar usuário' };
      }

      if (!data) {
        return { success: false, message: 'Usuário não encontrado' };
      }

      // Verifica a senha com bcryptjs
      const passwordMatches = await bcrypt.compare(password, data.encrypted_password);
      
      if (!passwordMatches) {
        return { success: false, message: 'Senha incorreta' };
      }
      
      // Atualizar last_sign_in_at
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq('id', data.id);
        
      if (updateError) {
        console.warn('Não foi possível atualizar last_sign_in_at:', updateError);
      }
      
      // Gera token e dados do usuário
      const userInfo = {
        id: data.id,
        email: data.email,
      };
      
      const token = btoa(JSON.stringify(userInfo));
      
      return {
        success: true,
        user: userInfo,
        token
      };
    } catch (error) {
      console.error('Erro durante login:', error);
      return { 
        success: false, 
        message: 'Erro no servidor: ' + (error instanceof Error ? error.message : String(error))
      };
    }
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async register(email: string, password: string) {
    try {
      if (!email || !password) {
        return { success: false, message: 'Email e senha são obrigatórios' };
      }
      
      // Verificar se o email já existe
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erro ao verificar email existente:', checkError);
        return { success: false, message: 'Erro ao verificar email' };
      }

      if (existingUser) {
        return { success: false, message: 'Este email já está em uso' };
      }

      // Hash da senha usando bcryptjs
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      
      // Criar novo usuário
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('users')
        .insert([
          { 
            email, 
            encrypted_password: hashedPassword,
            created_at: now,
            updated_at: now,
            last_sign_in_at: now
          }
        ])
        .select();

      if (error) {
        console.error('Erro ao registrar usuário:', error);
        return { success: false, message: 'Erro ao criar usuário: ' + error.message };
      }

      if (!data || data.length === 0) {
        return { success: false, message: 'Erro ao criar usuário: nenhum dado retornado' };
      }

      const newUser = data[0];
      const userInfo = {
        id: newUser.id,
        email: newUser.email,
      };
      
      return {
        success: true,
        user: userInfo,
        token: btoa(JSON.stringify(userInfo))
      };
    } catch (error) {
      console.error('Erro durante registro:', error);
      return { success: false, message: 'Erro no servidor: ' + (error instanceof Error ? error.message : String(error)) };
    }
  },

  // Verificar se o token é válido
  verifyToken() {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return { valid: false };
      }
      
      const decoded = JSON.parse(atob(token));
      
      if (!decoded || !decoded.id || !decoded.email) {
        return { valid: false };
      }
      
      return { 
        valid: true, 
        user: {
          id: decoded.id,
          email: decoded.email
        }
      };
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return { valid: false };
    }
  },

  async updateUser(userId: string, updates: { email?: string, password?: string }) {
    try {
      const updateData: any = { updated_at: new Date().toISOString() };
      
      if (updates.email) {
        // Verificar se o novo email já está em uso
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('email', updates.email)
          .neq('id', userId)
          .maybeSingle();
  
        if (checkError) {
          throw new Error('Erro ao verificar email: ' + checkError.message);
        }
  
        if (existingUser) {
          throw new Error('Este email já está em uso');
        }
        
        updateData.email = updates.email;
      }
      
      if (updates.password) {
        // Hash da nova senha com bcryptjs
        updateData.encrypted_password = await bcrypt.hash(updates.password, SALT_ROUNDS);
      }
      
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select();
      
      if (error) {
        throw error;
      }
      
      return { success: true, user: data[0] };
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return { 
        success: false, 
        message: 'Erro ao atualizar usuário: ' + (error instanceof Error ? error.message : String(error)) 
      };
    }
  },
  
  async deleteUser(userId: string) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
        
      if (error) {
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      return { 
        success: false, 
        message: 'Erro ao excluir usuário: ' + (error instanceof Error ? error.message : String(error)) 
      };
    }
  }
};