import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Memo from '../../../models/Memo';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';

// 토큰에서 사용자 ID 추출 함수
async function getUserIdFromToken(request) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-key');
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

// GET: 특정 날짜의 메모 조회 또는 사용자의 모든 메모 조회
export async function GET(request) {
  try {
    await connectDB();
    
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // YYYY-MM-DD 형식
    const month = searchParams.get('month'); // YYYY-MM 형식

    let query = { userId };

    if (date) {
      // 특정 날짜의 메모 조회
      query.date = date;
      const memo = await Memo.findOne(query);
      return NextResponse.json({ memo });
    } else if (month) {
      // 특정 월의 모든 메모 조회
      query.date = { $regex: `^${month}` };
      const memos = await Memo.find(query).sort({ date: 1 });
      return NextResponse.json({ memos });
    } else {
      // 사용자의 모든 메모 조회 (최근 순)
      const memos = await Memo.find(query).sort({ createdAt: -1 }).limit(50);
      return NextResponse.json({ memos });
    }

  } catch (error) {
    console.error('메모 조회 중 오류:', error);
    return NextResponse.json(
      { error: '메모 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 메모 생성
export async function POST(request) {
  try {
    await connectDB();
    
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { date, title, content, color } = await request.json();

    // 입력 검증
    if (!date || !content) {
      return NextResponse.json(
        { error: '날짜와 메모 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    // 날짜 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: '날짜는 YYYY-MM-DD 형식이어야 합니다.' },
        { status: 400 }
      );
    }

    // 중복 메모 확인
    const existingMemo = await Memo.findOne({ userId, date });
    if (existingMemo) {
      return NextResponse.json(
        { error: '해당 날짜에 이미 메모가 존재합니다.' },
        { status: 409 }
      );
    }

    const memo = new Memo({
      userId,
      date,
      title: title || '',
      content,
      color: color || 'blue'
    });

    await memo.save();
    
    return NextResponse.json(
      { message: '메모가 생성되었습니다.', memo },
      { status: 201 }
    );

  } catch (error) {
    console.error('메모 생성 중 오류:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: '해당 날짜에 이미 메모가 존재합니다.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: '메모 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 메모 수정
export async function PUT(request) {
  try {
    await connectDB();
    
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { date, title, content, color } = await request.json();

    // 입력 검증
    if (!date || !content) {
      return NextResponse.json(
        { error: '날짜와 메모 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    const memo = await Memo.findOneAndUpdate(
      { userId, date },
      { 
        title: title || '',
        content,
        color: color || 'blue',
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!memo) {
      return NextResponse.json(
        { error: '메모를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: '메모가 수정되었습니다.',
      memo
    });

  } catch (error) {
    console.error('메모 수정 중 오류:', error);
    return NextResponse.json(
      { error: '메모 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 메모 삭제
export async function DELETE(request) {
  try {
    await connectDB();
    
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: '삭제할 메모의 날짜가 필요합니다.' },
        { status: 400 }
      );
    }

    const memo = await Memo.findOneAndDelete({ userId, date });

    if (!memo) {
      return NextResponse.json(
        { error: '메모를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: '메모가 삭제되었습니다.'
    });

  } catch (error) {
    console.error('메모 삭제 중 오류:', error);
    return NextResponse.json(
      { error: '메모 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
