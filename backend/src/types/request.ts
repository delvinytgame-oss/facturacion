import { CompanyRole } from '../../prisma/generated/prisma/client';
import { CurrentUser } from '@/types/user';
import { Request } from 'express';

interface RequestCompany {
    id: string;
    name: string;
    role: CompanyRole;
}

interface RequestWithUser extends Request {
    user: CurrentUser
    session: { id: string }
    // Populated by AuthGuard: the tenant the request is scoped to, the
    // caller's role within it, and (for session-based auth) every company
    // the caller belongs to. Null companyId/role for a session with no
    // memberships yet (pre-onboarding).
    companyId: string | null
    role: CompanyRole | null
    companies: RequestCompany[]
}

export { RequestWithUser };