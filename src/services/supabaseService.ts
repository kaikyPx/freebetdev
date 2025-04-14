import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente do Supabase não definidas!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Use the built-in Supabase auth for security and reliability
export const authService = {
  async login(email: string, password: string) {
    try {
      // Use Supabase's built-in auth with email/password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Erro durante login:', error);
        return { 
          success: false, 
          message: error.message || 'Credenciais inválidas'
        };
      }

      if (!data || !data.user) {
        return { success: false, message: 'Usuário não encontrado' };
      }
      
      // Use the session token from Supabase for authentication
      const userInfo = {
        id: data.user.id,
        email: data.user.email
      };
      
      const token = data.session?.access_token || '';
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userInfo));
      localStorage.setItem('isAuthenticated', 'true');
      
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

  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('banks');
      
      return { success: true };
    } catch (error) {
      console.error('Erro durante logout:', error);
      return { success: false, message: String(error) };
    }
  },

  async register(email: string, password: string) {
    try {
      if (!email || !password) {
        return { success: false, message: 'Email e senha são obrigatórios' };
      }
  
      // Cria o usuário no sistema de autenticação do Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
  
      if (error) {
        console.error('Erro ao registrar usuário:', error);
        return {
          success: false,
          message: error.message || 'Erro ao criar usuário'
        };
      }
  
      if (!data || !data.user) {
        return { success: false, message: 'Erro ao criar usuário: nenhum dado retornado' };
      }
  
      // Se o Supabase exigir verificação de e-mail, avisa o usuário
      if (data.session === null) {
        return {
          success: false,
          message: 'Verifique seu e-mail para completar o registro',
          requiresEmailVerification: true
        };
      }
  
      const userInfo = {
        id: data.user.id,
        email: data.user.email || email,
      };
  
      const token = data.session?.access_token || '';
  
      // Armazena os dados localmente
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userInfo));
      localStorage.setItem('isAuthenticated', 'true');
  
      // Criptografa a senha manualmente antes de inserir na tabela users
      const encryptedPassword = await bcrypt.hash(password, 10); // 10 é o número de rounds
  
      // Insere o usuário na tabela personalizada "users", incluindo a senha criptografada
      const { error: insertError } = await supabase.from('users').insert([
        {
          id: data.user.id,
          email: userInfo.email,
          encrypted_password: encryptedPassword, // senha criptografada
          created_at: new Date().toISOString()
        }
      ]);
  
      if (insertError) {
        console.error('Erro ao inserir na tabela users:', insertError);
      }
  
      return {
        success: true,
        user: userInfo,
        token
      };
    } catch (error) {
      console.error('Erro durante registro:', error);
      return {
        success: false,
        message: 'Erro no servidor: ' + (error instanceof Error ? error.message : String(error))
      };
    }
  },

  // Verify token using Supabase session
  async verifyToken() {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        return { valid: false };
      }
      
      // The session is valid, get the user
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData || !userData.user) {
        return { valid: false };
      }
      
      return { 
        valid: true, 
        user: {
          id: userData.user.id,
          email: userData.user.email || ''
        }
      };
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return { valid: false };
    }
  },

  async updateUser(updates: { email?: string, password?: string }) {
    try {
      const updateData: any = {};
      
      if (updates.email) {
        updateData.email = updates.email;
      }
      
      if (updates.password) {
        updateData.password = updates.password;
      }
      
      const { data, error } = await supabase.auth.updateUser(updateData);
      
      if (error) {
        throw error;
      }
      
      if (!data.user) {
        return { success: false, message: 'Usuário não encontrado' };
      }
      
      const userInfo = {
        id: data.user.id,
        email: data.user.email || ''
      };
      
      // Update local storage
      localStorage.setItem('user', JSON.stringify(userInfo));
      
      return { success: true, user: userInfo };
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return { 
        success: false, 
        message: 'Erro ao atualizar usuário: ' + (error instanceof Error ? error.message : String(error)) 
      };
    }
  },
  
  async deleteUser() {
    try {
      const { error } = await supabase.auth.admin.deleteUser(
        (await supabase.auth.getUser()).data.user?.id || ''
      );
        
      if (error) {
        throw error;
      }
      
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      
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