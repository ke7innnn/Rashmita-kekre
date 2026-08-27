import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './db';
import { verifyPassword } from './password';

const HARDCODED_USERS = [
  { username: 'rashmita', password: 'rashmita123', name: 'Dr. Rashmita Karvir Kekre', role: 'ADMIN' },
  { username: 'drgachchami', password: 'physio123', name: 'Dr. Gachchami', role: 'PHYSIO' },
  { username: 'drpritee', password: 'physio123', name: 'Dr. Pritee', role: 'PHYSIO' },
  { username: 'physio', password: 'physio123', name: 'Physio Practitioner', role: 'PHYSIO' },
  { username: 'receptionist', password: 'receptionist123', name: 'Receptionist', role: 'RECEPTIONIST' },
];

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

          if (user) {
            const isValid = verifyPassword(credentials.password, user.password);
            if (isValid) {
              return {
                id: user.id,
                name: user.username,
                role: user.role,
              };
            }
          }
        } catch (error) {
          console.error('Prisma Auth error, attempting fallback:', error);
        }

        // Fallback check against hardcoded demo users
        const fallbackUser = HARDCODED_USERS.find(
          (u) => u.username.toLowerCase() === credentials.username.trim().toLowerCase() && u.password === credentials.password
        );

        if (fallbackUser) {
          return {
            id: fallbackUser.username,
            name: fallbackUser.name,
            role: fallbackUser.role,
          };
        }

        return null;
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
  secret: process.env.NEXTAUTH_SECRET || 'your-nextauth-secret-key-12345',
};
