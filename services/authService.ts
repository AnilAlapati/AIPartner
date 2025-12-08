
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

// Mocking backend interaction
export const loginWithGoogle = async (): Promise<UserProfile> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockUser: UserProfile = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name: 'Alex Doe',
        email: 'alex.doe@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
      };
      localStorage.setItem('mypartner_user', JSON.stringify(mockUser));
      resolve(mockUser);
    }, 1500); // Simulate network delay
  });
};

export const logout = () => {
  localStorage.removeItem('mypartner_user');
};

export const getCurrentUser = (): UserProfile | null => {
  const stored = localStorage.getItem('mypartner_user');
  return stored ? JSON.parse(stored) : null;
};
