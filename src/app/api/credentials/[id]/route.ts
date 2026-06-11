import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Credential from '@/lib/models/Credential';
import { encrypt } from '@/lib/encryption';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { site, username, password, project, notes } = await req.json();

    await dbConnect();

    const credential = await Credential.findById(params.id);
    if (!credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    if (site !== undefined) credential.site = site;
    if (username !== undefined) credential.username = username;
    if (project !== undefined) credential.project = project || null;
    if (notes !== undefined) credential.notes = notes;
    
    if (password) {
      credential.password = encrypt(password);
    }

    await credential.save();

    return NextResponse.json({
      _id: credential._id,
      site: credential.site,
      username: credential.username,
      project: credential.project,
      notes: credential.notes,
      updatedAt: credential.updatedAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const credential = await Credential.findByIdAndDelete(params.id);
    if (!credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Credential deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
