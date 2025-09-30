import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

/**
 * JWT 토큰 검증
 * @param {string} token
 * @returns {Object|null} 디코딩된 토큰 데이터 또는 null
 */
function verifyToken(token) {
  try {
    const secret = process.env.JWT_SECRET || 'your-jwt-secret-key';
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

/**
 * 현재 사용자 정보 조회 API 엔드포인트
 * @param {Request} request 
 * @returns {NextResponse}
 */
export async function GET(request) {
  try {
    // 쿠키에서 토큰 추출
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: '인증 토큰이 없습니다.' },
        { status: 401 }
      );
    }

    // 토큰 검증
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    // MongoDB 연결
    await connectDB();

    // 사용자 정보 조회
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 응답
    return NextResponse.json(
      {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          location: user.location,
          preferences: user.preferences,
          createdAt: user.createdAt
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('사용자 정보 조회 에러:', error);

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
