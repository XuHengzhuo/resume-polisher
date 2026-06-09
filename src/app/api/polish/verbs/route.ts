import { NextRequest, NextResponse } from 'next/server';
import { mockVerbEnhance } from '@/lib/mock-ai';
import { OpsDirection } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { text, direction } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ success: false, error: '缺少 text 参数' }, { status: 400 });
    }

    const opsDirection: OpsDirection = direction || 'user_ops';
    const changes = mockVerbEnhance(text, opsDirection);

    return NextResponse.json({
      success: true,
      data: { changes },
    });
  } catch {
    return NextResponse.json({ success: false, error: '服务内部错误' }, { status: 500 });
  }
}
