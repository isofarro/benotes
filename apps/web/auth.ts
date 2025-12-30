import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        // Simple User = Tenant mapping logic
        // In a real app, this would check a users database
        if (!credentials?.username) {
          return null;
        }

        const username = credentials.username as string;
        
        // For Walking Skeleton: Any non-empty username is valid
        // Password is currently ignored (or simple check)
        return {
          id: username,
          name: username,
          email: `${username}@example.com`,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: async ({ auth }) => {
      // Logged in users are authenticated, otherwise redirect to login
      return !!auth;
    },
  },
});
