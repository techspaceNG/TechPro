export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Note from '@/lib/models/Note';
import Project from '@/lib/models/Project';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const isGlobal = searchParams.get('isGlobal');

    await dbConnect();

    const query: any = { user: userId };
    if (projectId) {
      query.project = projectId;
    } else if (isGlobal === 'true') {
      query.isGlobal = true;
    }

    const notes = await Note.find(query).populate('project', 'name').sort({ updatedAt: -1 });
    return NextResponse.json(notes);
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
    const { title, content, project, isGlobal } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
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

    const note = await Note.create({
      title,
      user: userId,
      content,
      project: linkedProject,
      isGlobal: isGlobal ?? !linkedProject,
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
