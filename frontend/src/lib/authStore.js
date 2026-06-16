import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('crowdfix_token') || null,
  userId: localStorage.getItem('crowdfix_userId') || null,
  role: localStorage.getItem('crowdfix_role') || null,
  
  setAuth: (user, token) => {
    localStorage.setItem('crowdfix_token', token);
    localStorage.setItem('crowdfix_userId', user.id);
    localStorage.setItem('crowdfix_role', user.role);
    set({ user, token, userId: user.id, role: user.role });
  },
  
  logout: () => {
    localStorage.removeItem('crowdfix_token');
    localStorage.removeItem('crowdfix_userId');
    localStorage.removeItem('crowdfix_role');
    set({ user: null, token: null, userId: null, role: null });
  },
}));

export default useAuthStore;