import { NextRequest, NextResponse } from 'next/server';
import { mockDetectChain, mockHomogeneityCheck } from '@/lib/mock-ai';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ success: false, error: '缺少 text 参数' }, { status: 400 });
    }

    const issues = mockDetectChain(text);
    const homogeneity = mockHomogeneityCheck(text);

    return NextResponse.json({
      success: true,
      data: {
        issues,
        homogeneity,
        summary: `检测到 ${issues.length} 处链路过短问题，同质化评分: ${homogeneity.score}/100`,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: '服务内部错误' }, { status: 500 });
  }
}
