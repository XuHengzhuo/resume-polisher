import { NextRequest, NextResponse } from 'next/server';
import { mockMatchScore } from '@/lib/mock-ai';

export async function POST(req: NextRequest) {
  try {
    const { resume_text, jd_text } = await req.json();

    if (!resume_text || !jd_text) {
      return NextResponse.json(
        { success: false, error: '缺少 resume_text 或 jd_text 参数' },
        { status: 400 }
      );
    }

    const result = mockMatchScore(resume_text, jd_text);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch {
    return NextResponse.json({ success: false, error: '服务内部错误' }, { status: 500 });
  }
}
