import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getUserIdFromToken(request) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-key');
    return decoded.userId;
  } catch (e) {
    return null;
  }
}

export async function GET(request) {
  try {
    await connectDB();
    const userId = await getUserIdFromToken(request);
    if (!userId) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });

    return NextResponse.json({
      settings: {
        temperatureUnit: user.preferences?.temperatureUnit || 'celsius',
        notifications: typeof user.preferences?.notifications === 'boolean' ? user.preferences.notifications : true,
        language: user.preferences?.language || 'ko'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: '설정 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    const userId = await getUserIdFromToken(request);
    if (!userId) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

    const { temperatureUnit, notifications, language } = await request.json();

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });

    user.preferences = {
      ...user.preferences,
      ...(typeof temperatureUnit === 'string' ? { temperatureUnit } : {}),
      ...(typeof notifications === 'boolean' ? { notifications } : {}),
      ...(typeof language === 'string' ? { language } : {})
    };

    await user.save();

    // 언어 쿠키 설정
    if (typeof language === 'string') {
      const cookieStore = await cookies();
      cookieStore.set('lang', language, { path: '/', httpOnly: false, sameSite: 'lax' });
    }

    return NextResponse.json({ message: '설정이 업데이트되었습니다.' });
  } catch (error) {
    return NextResponse.json({ error: '설정 업데이트 중 오류가 발생했습니다.' }, { status: 500 });
  }
}


