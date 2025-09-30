import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { z } from 'zod';

// 회원가입 유효성 검사 스키마
const registerSchema = z.object({
  email: z
    .string()
    .email('유효한 이메일 주소를 입력해주세요.')
    .min(1, '이메일은 필수입니다.'),
  password: z
    .string()
    .min(6, '비밀번호는 최소 6자 이상이어야 합니다.')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      '비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다.'
    ),
  name: z
    .string()
    .min(1, '이름은 필수입니다.')
    .max(50, '이름은 50자를 초과할 수 없습니다.')
    .trim(),
  location: z.string().optional().default('서울')
});

/**
 * 회원가입 API 엔드포인트
 * @param {Request} request 
 * @returns {NextResponse}
 */
export async function POST(request) {
  try {
    // 요청 본문 파싱
    const body = await request.json();
    
    // 입력값 유효성 검사
    const validationResult = registerSchema.safeParse(body);
    
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

    const { email, password, name, location } = validationResult.data;

    // MongoDB 연결
    await connectDB();

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: '이미 가입된 이메일 주소입니다.' },
        { status: 409 }
      );
    }

    // 새 사용자 생성
    const newUser = new User({
      email,
      password,
      name,
      location
    });

    // 사용자 저장 (비밀번호는 자동으로 해싱됨)
    await newUser.save();

    // 응답 (비밀번호 제외)
    return NextResponse.json(
      {
        message: '회원가입이 완료되었습니다.',
        user: {
          id: newUser._id,
          email: newUser.email,
          name: newUser.name,
          location: newUser.location,
          createdAt: newUser.createdAt
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('회원가입 에러:', error);

    // MongoDB 유효성 검사 에러 처리
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
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

    // 중복 키 에러 처리
    if (error.code === 11000) {
      return NextResponse.json(
        { error: '이미 가입된 이메일 주소입니다.' },
        { status: 409 }
      );
    }

    // 기타 서버 에러
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
