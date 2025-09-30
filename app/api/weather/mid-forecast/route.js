import { NextResponse } from 'next/server';

/**
 * 기상청 중기육상예보조회 API
 * 예보일로부터 4일에서 10일까지의 육상날씨정보를 조회
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const regId = searchParams.get('regId') || '11B00000'; // 기본값: 서울, 인천, 경기도
    
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

    const apiUrl = 'http://apis.data.go.kr/1360000/MidFcstInfoService/getMidLandFcst';
    const params = new URLSearchParams({
      serviceKey: decodeURIComponent(serviceKey),
      numOfRows: '10',
      pageNo: '1',
      dataType: 'JSON',
      regId: regId,
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
        { error: '예보 데이터가 없습니다.' },
        { status: 404 }
      );
    }

    const forecast = items[0];
    
    // 예보 데이터 정규화
    const forecastData = {
      regId: forecast.regId,
      tmFc: tmFc,
      forecast: []
    };

    // 6시 발표의 경우 4일 후부터, 18시 발표의 경우 5일 후부터
    const startDay = tmFc.endsWith('0600') ? 4 : 5;
    
    for (let day = startDay; day <= 10; day++) {
      const dayData = {
        day: day,
        date: getDateAfterDays(day),
        morning: {
          weather: forecast[`wf${day}Am`] || null,
          rainProbability: forecast[`rnSt${day}Am`] || null
        },
        afternoon: {
          weather: forecast[`wf${day}Pm`] || null,
          rainProbability: forecast[`rnSt${day}Pm`] || null
        }
      };
      
      // 8일 이후는 하루 단위 예보
      if (day >= 8) {
        dayData.daily = {
          weather: forecast[`wf${day}`] || null,
          rainProbability: forecast[`rnSt${day}`] || null
        };
        delete dayData.morning;
        delete dayData.afternoon;
      }
      
      forecastData.forecast.push(dayData);
    }

    return NextResponse.json({
      success: true,
      data: forecastData,
      metadata: {
        regId: regId,
        tmFc: tmFc,
        lastUpdate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('중기육상예보 API 에러:', error);
    return NextResponse.json(
      { error: error.message || '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 현재 날짜로부터 N일 후의 날짜 문자열 반환
 */
function getDateAfterDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = dayNames[date.getDay()];
  
  return `${month}월 ${day}일 (${dayName})`;
}
