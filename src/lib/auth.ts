import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './db';
import { verifyPassword } from './password';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Please enter both username and password.');
        }

        try {
          const user = await prisma.user.findFirst({
            where: {
              username: {
                equals: credentials.username.trim(),
                mode: 'insensitive',
              },
            },
          });

          if (!user) {
            return null;
          }

          const isValid = verifyPassword(credentials.password, user.password);

          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            name: user.username,
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/crm360/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development-only',
};
