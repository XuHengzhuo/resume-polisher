import { NextRequest, NextResponse } from 'next/server';
import { mockExtractKeywords } from '@/lib/mock-ai';

export async function POST(req: NextRequest) {
  try {
    const { jd_text } = await req.json();

    if (!jd_text || typeof jd_text !== 'string') {
      return NextResponse.json({ success: false, error: '缺少 jd_text 参数' }, { status: 400 });
    }

    const keywords = mockExtractKeywords(jd_text);
    const missingCount = keywords.filter(k => !k.found).length;

    return NextResponse.json({
      success: true,
      data: {
        keywords,
        suggestions: keywords
          .filter(k => !k.found)
          .map(k => `建议在简历中增加"${k.keyword}"相关经验描述`),
        summary: `共识别 ${keywords.length} 个关键词，简历中缺少 ${missingCount} 个`,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: '服务内部错误' }, { status: 500 });
  }
}
