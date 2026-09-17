import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/password';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const user = await db.user.findUnique({
            where: { username: credentials.username },
          });

          if (!user) {
            console.log('Auth: User not found:', credentials.username);
            return null;
          }
          if (!verifyPassword(credentials.password, user.password)) {
            console.log('Auth: Invalid password for:', credentials.username);
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            role: user.role,
            username: user.username,
            assignedSubCity: user.assignedSubCity,
            assignedArea: user.assignedArea,
          };
        } catch (err) {
          console.error('AUTH ERROR:', err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as Record<string, unknown>).role;
        token.username = (user as Record<string, unknown>).username;
        token.assignedSubCity = (user as Record<string, unknown>).assignedSubCity;
        token.assignedArea = (user as Record<string, unknown>).assignedArea;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).username = token.username;
        (session.user as Record<string, unknown>).assignedSubCity = token.assignedSubCity;
        (session.user as Record<string, unknown>).assignedArea = token.assignedArea;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'bishoftu-survey-secret-key-2024',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
