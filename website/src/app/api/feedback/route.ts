import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Feedback from '@/models/Feedback';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    
    if (!body.message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const feedback = await Feedback.create({
      name: body.name || 'Anonymous',
      email: body.email || '',
      message: body.message,
    });

    return NextResponse.json({ success: true, feedback }, { status: 201 });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
