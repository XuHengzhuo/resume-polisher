import { NextRequest, NextResponse } from 'next/server';
import { mockInterviewQuestions } from '@/lib/mock-ai';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ success: false, error: '缺少 text 参数' }, { status: 400 });
    }

    const questions = mockInterviewQuestions(text);

    const categories = [
      { key: 'data', label: '📊 数据追问' },
      { key: 'method', label: '🔬 方法论深挖' },
      { key: 'scenario', label: '🎯 情境模拟' },
      { key: 'detail', label: '🔍 项目细节' },
    ];

    return NextResponse.json({
      success: true,
      data: {
        questions,
        categories: categories.map(c => ({
          ...c,
          count: questions.filter(q => q.category === c.key).length,
        })),
        summary: `根据简历内容，共生成 ${questions.length} 道面试模拟题`,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: '服务内部错误' }, { status: 500 });
  }
}
