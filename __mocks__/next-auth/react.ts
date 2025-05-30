export const signIn = jest.fn().mockResolvedValue({ ok: true });
export const signOut = jest.fn().mockResolvedValue({ ok: true });

export const useSession = jest.fn(() => ({
  data: null,
  status: 'unauthenticated',
  update: jest.fn(),
}));

export const getSession = jest.fn().mockResolvedValue(null);
export const getProviders = jest.fn().mockResolvedValue({});

export default {
  signIn,
  signOut,
  useSession,
  getSession,
  getProviders,
};
