/**
 * Mock auth module for testing
 */
export const authOptions = {
  // Mock options that match what's needed for tests
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    session: ({ session, token }: any) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub || 'test-user-id',
        }
      };
    }
  }
};
