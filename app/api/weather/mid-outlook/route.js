import { NextResponse } from 'next/server';

/**
 * 기상청 중기전망조회 API
 * 지점번호, 발표시각의 조회조건으로 기상전망정보를 조회
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const stnId = searchParams.get('stnId') || '108'; // 기본값: 전국
    
    const serviceKey = process.env.OPENAPI_KEY;
    if (!serviceKey) {
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 현재 시간을 기준으로 최신 발표시각 결정 (06시 또는 18시)
    const now = new Date();
    const currentHour = now.getHours();
    const today = now.toISOString().slice(0, 10).replace(/-/g, '');
    
    let tmFc;
    if (currentHour >= 18) {
      tmFc = `${today}1800`; // 18시 발표본
    } else if (currentHour >= 6) {
      tmFc = `${today}0600`; // 06시 발표본
    } else {
      // 06시 이전이면 전날 18시 발표본
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10).replace(/-/g, '');
      tmFc = `${yesterdayStr}1800`;
    }

    const apiUrl = 'http://apis.data.go.kr/1360000/MidFcstInfoService/getMidFcst';
    const params = new URLSearchParams({
      serviceKey: decodeURIComponent(serviceKey),
      numOfRows: '10',
      pageNo: '1',
      dataType: 'JSON',
      stnId: stnId,
      tmFc: tmFc
    });

    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    
    // API 응답 검증
    if (data.response?.header?.resultCode !== '00') {
      throw new Error(`API 에러: ${data.response?.header?.resultMsg || '알 수 없는 오류'}`);
    }

    const items = data.response?.body?.items?.item;
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: '전망 데이터가 없습니다.' },
        { status: 404 }
      );
    }

    const outlook = items[0];
    
    return NextResponse.json({
      success: true,
      data: {
        stnId: stnId,
        tmFc: tmFc,
        outlook: outlook.wfSv || '기상전망 정보가 없습니다.',
        lastUpdate: new Date().toISOString()
      },
      metadata: {
        stnId: stnId,
        tmFc: tmFc,
        lastUpdate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('중기전망조회 API 에러:', error);
    return NextResponse.json(
      { error: error.message || '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
