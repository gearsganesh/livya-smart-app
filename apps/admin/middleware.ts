import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type StaffRole = 'admin' | 'clinical' | 'doctor' | 'nutritionist' | 'therapist' | 'operations' | 'billing' | 'support';

const routeRoles: Array<[string, StaffRole[]]> = [
  ['/settings', ['admin']],
  ['/reports', ['admin', 'clinical', 'doctor']],
  ['/patients', ['admin', 'clinical', 'doctor', 'nutritionist', 'therapist', 'operations', 'support']],
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: claimsData, error } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (error || !userId) return NextResponse.redirect(new URL('/login', request.url));

  const { data: staff } = await supabase
    .from('staff_users')
    .select('active,role')
    .eq('user_id', userId)
    .maybeSingle();
  if (!staff?.active) return NextResponse.redirect(new URL('/login?error=staff_access_required', request.url));

  const rule = routeRoles.find(([prefix]) => request.nextUrl.pathname.startsWith(prefix));
  if (rule && staff.role !== 'admin' && !rule[1].includes(staff.role as StaffRole)) {
    return NextResponse.redirect(new URL('/dashboard?error=forbidden', request.url));
  }
  return response;
}

export const config = { matcher: ['/dashboard/:path*', '/patients/:path*', '/reports/:path*', '/settings/:path*'] };
