import { NextRequest, NextResponse } from 'next/server';
import { mockStarExpand } from '@/lib/mock-ai';
import { StarScenario } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { text, scenario } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ success: false, error: '缺少 text 参数' }, { status: 400 });
    }

    const starScenario: StarScenario = scenario || 'acquisition';
    const result = mockStarExpand(text, starScenario);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch {
    return NextResponse.json({ success: false, error: '服务内部错误' }, { status: 500 });
  }
}
