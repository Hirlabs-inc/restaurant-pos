import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse('File uploads are unavailable in this demo.', { status: 404 });
}
