import { NextRequest, NextResponse } from 'next/server';
import { mockQuantifyTemplates } from '@/lib/mock-ai';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ success: false, error: '缺少 text 参数' }, { status: 400 });
    }

    const templates = mockQuantifyTemplates(text);

    return NextResponse.json({
      success: true,
      data: { templates },
    });
  } catch {
    return NextResponse.json({ success: false, error: '服务内部错误' }, { status: 500 });
  }
}
