export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export async function GET() {
  try {
    await dbConnect();
    const count = await User.countDocuments();
    return NextResponse.json({ registrationAllowed: count === 0 });
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

    const count = await User.countDocuments();
    if (count > 0) {
      return NextResponse.json(
        { error: 'Registration is disabled. An administrator account already exists.' },
        { status: 403 }
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
      message: 'Administrator account created successfully' 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
