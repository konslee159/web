import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// JWT 토큰 검증
function verifyToken(token) {
  try {
    const secret = process.env.JWT_SECRET || 'your-jwt-secret-key';
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

// 계정 업데이트 유효성 검사 스키마
const updateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, '이름은 필수입니다.')
      .max(50, '이름은 50자를 초과할 수 없습니다.')
      .optional(),
    location: z.string().trim().optional(),
    preferences: z
      .object({
        temperatureUnit: z.enum(['celsius', 'fahrenheit']).optional(),
        notifications: z.boolean().optional()
      })
      .partial()
      .optional(),
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요.').optional(),
    newPassword: z
      .string()
      .min(6, '비밀번호는 최소 6자 이상이어야 합니다.')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        '비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다.'
      )
      .optional()
  })
  .refine(
    (data) => {
      // 비밀번호 변경은 currentPassword, newPassword 둘 다 있어야 함
      const hasCurrent = typeof data.currentPassword === 'string';
      const hasNew = typeof data.newPassword === 'string';
      return (hasCurrent && hasNew) || (!hasCurrent && !hasNew);
    },
    {
      message: '비밀번호를 변경하려면 현재 비밀번호와 새 비밀번호를 모두 입력해주세요.',
      path: ['newPassword']
    }
  );

/**
 * 계정 정보 업데이트 API 엔드포인트 (부분 업데이트)
 * 허용 필드: name, location, preferences, (currentPassword + newPassword)
 */
export async function PATCH(request) {
  try {
    // 인증 토큰 확인
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: '인증 토큰이 없습니다.' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json();
    const validationResult = updateSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
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

    const { name, location, preferences, currentPassword, newPassword } =
      validationResult.data;

    // 변경할 내용이 없는 경우
    if (
      typeof name === 'undefined' &&
      typeof location === 'undefined' &&
      typeof preferences === 'undefined' &&
      typeof currentPassword === 'undefined' &&
      typeof newPassword === 'undefined'
    ) {
      return NextResponse.json(
        { error: '변경할 항목이 없습니다.' },
        { status: 400 }
      );
    }

    // DB 연결 및 사용자 조회
    await connectDB();
    const userId = decoded.userId;

    // 비밀번호 변경이 필요한 경우 비밀번호 포함하여 조회
    const user = await User.findById(userId).select(
      currentPassword ? '+password' : undefined
    );

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 일반 필드 업데이트
    if (typeof name !== 'undefined') user.name = name;
    if (typeof location !== 'undefined') user.location = location;
    if (typeof preferences !== 'undefined') {
      user.preferences = {
        ...user.preferences,
        ...(typeof preferences.temperatureUnit !== 'undefined'
          ? { temperatureUnit: preferences.temperatureUnit }
          : {}),
        ...(typeof preferences.notifications !== 'undefined'
          ? { notifications: preferences.notifications }
          : {})
      };
    }

    // 비밀번호 변경 처리
    if (typeof currentPassword !== 'undefined' && typeof newPassword !== 'undefined') {
      const isValid = await user.comparePassword(currentPassword);
      if (!isValid) {
        return NextResponse.json(
          { error: '현재 비밀번호가 올바르지 않습니다.' },
          { status: 401 }
        );
      }
      user.password = newPassword; // pre('save')에서 해싱됨
    }

    await user.save();

    return NextResponse.json(
      {
        message: '계정 정보가 업데이트되었습니다.',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          location: user.location,
          preferences: user.preferences,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('계정 업데이트 에러:', error);

    // MongoDB 유효성 검사 에러 처리
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => ({
        // @ts-ignore mongoose ValidationErrorItem has path
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

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT 메서드도 PATCH와 동일하게 동작하도록 허용 (선택 사항)
export const PUT = PATCH;


