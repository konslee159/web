import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

// 로그인 유효성 검사 스키마
const loginSchema = z.object({
  email: z
    .string()
    .email('유효한 이메일 주소를 입력해주세요.')
    .min(1, '이메일은 필수입니다.'),
  password: z
    .string()
    .min(1, '비밀번호는 필수입니다.')
});

/**
 * JWT 토큰 생성
 * @param {Object} payload 토큰에 포함할 데이터
 * @returns {string} JWT 토큰
 */
function generateToken(payload) {
  const secret = process.env.JWT_SECRET || 'your-jwt-secret-key';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

/**
 * 로그인 API 엔드포인트
 * @param {Request} request 
 * @returns {NextResponse}
 */
export async function POST(request) {
  try {
    // 요청 본문 파싱
    const body = await request.json();
    
    // 입력값 유효성 검사
    const validationResult = loginSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path[0],
        message: err.message
      }));
      
      return NextResponse.json(
        { 
          error: '입력값이 올바르지 않습니다.',
          details: errors
        },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // MongoDB 연결
    await connectDB();

    // 사용자 찾기
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 비밀번호 확인
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // JWT 토큰 생성
    const token = generateToken({
      userId: user._id,
      email: user.email,
      name: user.name
    });

    // 응답
    const response = NextResponse.json(
      {
        message: '로그인이 완료되었습니다.',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          location: user.location,
          preferences: user.preferences
        }
      },
      { status: 200 }
    );

    // HTTP-only 쿠키로 토큰 설정
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
    });

    return response;

  } catch (error) {
    console.error('로그인 에러:', error);

    // 기타 서버 에러
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
