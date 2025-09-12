import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const header = req.headers.get('authorization');
  const token = header?.replace(/^Bearer\s+/i, '') || req.cookies.get('token')?.value;

  if (token && token === process.env.API_TOKEN) {
    return NextResponse.next();
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export const config = {
  matcher: ['/api/:path*'],
};
