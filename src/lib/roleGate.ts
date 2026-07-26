import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function requireRole(allowedRoles: Role[]) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null, user: null };
  }

  const roleRaw = (session.user as any).role;
  const userRole: Role = roleRaw === 'admin' || roleRaw === Role.ADMIN ? Role.ADMIN : Role.PHYSIO;

  const isAllowed = userRole === Role.ADMIN || allowedRoles.includes(userRole);

  if (!isAllowed) {
    return { 
      errorResponse: NextResponse.json({ error: 'Forbidden. Authorized role required.' }, { status: 403 }), 
      session, 
      user: session.user,
      role: userRole
    };
  }

  return { errorResponse: null, session, user: session.user, role: userRole };
}
