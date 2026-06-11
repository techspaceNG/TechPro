import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Note from '@/lib/models/Note';
import Project from '@/lib/models/Project';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { title, content, project, isGlobal } = await req.json();

    await dbConnect();

    const note = await Note.findOne({ _id: params.id, user: userId });
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (project) {
      const projectExists = await Project.findOne({ _id: project, user: userId });
      if (!projectExists) {
        return NextResponse.json({ error: 'Invalid project ID or permission denied' }, { status: 400 });
      }
    }

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (project !== undefined) note.project = project || null;
    if (isGlobal !== undefined) note.isGlobal = isGlobal;

    await note.save();

    return NextResponse.json(note);
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

    const userId = (session.user as any).id;
    await dbConnect();
    const note = await Note.findOneAndDelete({ _id: params.id, user: userId });
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Note deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
