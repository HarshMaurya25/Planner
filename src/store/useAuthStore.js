import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,

  initializeAuth: async () => {
    const stored = localStorage.getItem('workflow_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', parsed.id)
          .single();
        if (data) set({ user: data });
        else localStorage.removeItem('workflow_user');
      } catch (_) {
        localStorage.removeItem('workflow_user');
      }
    }
    set({ loading: false });
  },

  signIn: async (username, password) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.trim().toLowerCase())
      .eq('password', password)
      .single();
    if (error || !data) throw new Error('Invalid username or password');
    localStorage.setItem('workflow_user', JSON.stringify(data));
    set({ user: data });
    return data;
  },

  signUp: async (username, password) => {
    const uname = username.trim().toLowerCase();
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', uname)
      .single();
    if (existing) throw new Error('Username already taken');

    const { data, error } = await supabase
      .from('users')
      .insert({ username: uname, password })
      .select()
      .single();
    if (error) throw error;
    localStorage.setItem('workflow_user', JSON.stringify(data));
    set({ user: data });
    return data;
  },

  updatePassword: async (newPassword) => {
    const user = get().user;
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    set({ user: data });
    localStorage.setItem('workflow_user', JSON.stringify(data));
    return data;
  },

  signOut: () => {
    localStorage.removeItem('workflow_user');
    set({ user: null });
  },
}));
