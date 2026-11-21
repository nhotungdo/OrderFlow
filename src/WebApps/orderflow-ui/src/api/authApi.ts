import type { User } from '../types';

const MOCK_USERS: User[] = [
  { id: 'usr-customer-1', name: 'Alice Nguyen (Customer)', email: 'alice@orderflow.dev', role: 'Customer' },
  { id: 'usr-customer-2', name: 'Bob Tran (Customer)', email: 'bob@orderflow.dev', role: 'Customer' },
  { id: 'usr-admin-1', name: 'DevOps Lead (Admin)', email: 'admin@orderflow.dev', role: 'Admin' },
];

export const authApi = {
  getCurrentUser: (): User => {
    const saved = localStorage.getItem('orderflow_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return MOCK_USERS[0];
  },

  login: async (email: string, _role?: 'Customer' | 'Admin'): Promise<User> => {
    const user = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase()) || {
      id: `usr-${Date.now()}`,
      name: email.split('@')[0],
      email,
      role: email.includes('admin') ? 'Admin' : 'Customer',
    };
    localStorage.setItem('orderflow_user', JSON.stringify(user));
    localStorage.setItem('orderflow_token', `mock-jwt-token-for-${user.id}`);
    return user;
  },

  switchUser: (role: 'Customer' | 'Admin'): User => {
    const user = role === 'Admin' ? MOCK_USERS[2] : MOCK_USERS[0];
    localStorage.setItem('orderflow_user', JSON.stringify(user));
    localStorage.setItem('orderflow_token', `mock-jwt-token-for-${user.id}`);
    return user;
  },

  logout: () => {
    localStorage.removeItem('orderflow_user');
    localStorage.removeItem('orderflow_token');
  },

  getMockUsers: () => MOCK_USERS,
};
