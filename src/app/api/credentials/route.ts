export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Credential from '@/lib/models/Credential';
import Project from '@/lib/models/Project';
import { encrypt } from '@/lib/encryption';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    await dbConnect();

    const query: any = { user: userId };
    if (projectId) {
      query.project = projectId;
    }

    const credentials = await Credential.find(query).populate('project', 'name').sort({ updatedAt: -1 });
    
    // Safety check: do NOT return the encrypted password hash in listing endpoints
    const safeCredentials = credentials.map(cred => ({
      _id: cred._id,
      project: cred.project,
      site: cred.site,
      username: cred.username,
      notes: cred.notes,
      createdAt: cred.createdAt,
      updatedAt: cred.updatedAt,
    }));

    return NextResponse.json(safeCredentials);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { site, username, password, project, notes } = await req.json();

    if (!site || !username || !password) {
      return NextResponse.json({ error: 'Site, username, and password are required' }, { status: 400 });
    }

    await dbConnect();

    // Verify linked project belongs to this user
    let linkedProject = null;
    if (project) {
      const projectExists = await Project.findOne({ _id: project, user: userId });
      if (!projectExists) {
        return NextResponse.json({ error: 'Invalid project ID or permission denied' }, { status: 400 });
      }
      linkedProject = project;
    }

    // Secure encryption step using AES-256-GCM
    const encryptedPassword = encrypt(password);

    const credential = await Credential.create({
      site,
      user: userId,
      username,
      password: encryptedPassword,
      project: linkedProject,
      notes: notes || '',
    });

    return NextResponse.json({
      _id: credential._id,
      site: credential.site,
      username: credential.username,
      project: credential.project,
      notes: credential.notes,
      createdAt: credential.createdAt,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
