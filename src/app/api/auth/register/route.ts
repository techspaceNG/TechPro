export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export async function GET() {
  try {
    return NextResponse.json({ registrationAllowed: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { email, password, name, occupation } = await req.json();

    if (!email || !password || !name || !occupation) {
      return NextResponse.json(
        { error: 'Email, password, full name, and occupation are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if email is already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      occupation: occupation.trim(),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Account created successfully' 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
