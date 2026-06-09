import { NextRequest, NextResponse } from 'next/server';
import { mockGrammarCheck } from '@/lib/mock-ai';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ success: false, error: '缺少 text 参数' }, { status: 400 });
    }

    const changes = mockGrammarCheck(text);

    // 如果配置了 LLM API key，这里调用真实 API
    // const changes = await callLLM('grammar', text);

    return NextResponse.json({
      success: true,
      data: { changes, fixed_text: text }, // fixed_text 在实际调用时由 LLM 返回
    });
  } catch {
    return NextResponse.json({ success: false, error: '服务内部错误' }, { status: 500 });
  }
}
