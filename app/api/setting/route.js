import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

function verifyToken(token) {
  try {
    const secret = process.env.JWT_SECRET || 'your-jwt-secret-key';
    return jwt.verify(token, secret);
  } catch (e) {
    return null;
  }
}

const settingsSchema = z.object({
  temperatureUnit: z.enum(['celsius', 'fahrenheit']).optional(),
  notifications: z.boolean().optional(),
  language: z.enum(['ko', 'en']).optional()
}).partial();

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: '인증 토큰이 없습니다.' }, { status: 401 });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({
      settings: {
        temperatureUnit: user.preferences?.temperatureUnit ?? 'celsius',
        notifications: typeof user.preferences?.notifications === 'boolean' ? user.preferences.notifications : true,
        language: user.preferences?.language ?? 'ko'
      }
    }, { status: 200 });
  } catch (error) {
    console.error('설정 조회 에러:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: '인증 토큰이 없습니다.' }, { status: 401 });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    const body = await request.json();
    const validation = settingsSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({ field: err.path[0], message: err.message }));
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.', details: errors }, { status: 400 });
    }

    const { temperatureUnit, notifications, language } = validation.data;
    if (
      typeof temperatureUnit === 'undefined' &&
      typeof notifications === 'undefined' &&
      typeof language === 'undefined'
    ) {
      return NextResponse.json({ error: '변경할 항목이 없습니다.' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    user.preferences = {
      ...user.preferences,
      ...(typeof temperatureUnit !== 'undefined' ? { temperatureUnit } : {}),
      ...(typeof notifications !== 'undefined' ? { notifications } : {}),
      ...(typeof language !== 'undefined' ? { language } : {})
    };

    await user.save();

    return NextResponse.json({
      message: '설정이 업데이트되었습니다.',
      settings: {
        temperatureUnit: user.preferences.temperatureUnit,
        notifications: user.preferences.notifications,
        language: user.preferences.language
      }
    }, { status: 200 });
  } catch (error) {
    console.error('설정 업데이트 에러:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}


