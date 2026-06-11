export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Document from '@/lib/models/Document';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const documents = await Document.find({}).sort({ createdAt: -1 });
    return NextResponse.json(documents);
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

    const { name, content, fileType, size } = await req.json();

    if (!name || !content) {
      return NextResponse.json({ error: 'Document name and content are required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    let summary = '';
    let analysis = '';

    try {
      const prompt = `You are an AI technical analyst for TechPro. 
Analyze the following document.
Document Name: ${name}
Document Content:
${content}

Provide your response in JSON format with exactly two keys:
1. "summary": A concise, paragraphs-based technical summary (2-3 paragraphs).
2. "analysis": A markdown-formatted detailed list of key takeaways, main findings, action items, or critical details from the document.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-goog-api-key': process.env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const parsed = JSON.parse(text.trim());
      summary = parsed.summary || '';
      analysis = parsed.analysis || '';
    } catch (aiError: any) {
      console.error('Gemini API Error:', aiError);
      summary = 'Failed to generate AI summary automatically. Please review the raw content.';
      analysis = `AI Analysis failed: ${aiError.message || 'Unknown error'}`;
    }

    await dbConnect();
    const doc = await Document.create({
      name,
      content,
      summary,
      analysis,
      fileType: fileType || 'txt',
      size: size || content.length,
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
