/**
 * 기상청 예보구역코드 매핑 시스템
 * 중기예보 API에서 사용하는 각종 코드 정보
 */

// 중기기상전망조회 지점번호
export const outlookStations = {
  전국: '108',
  서울: '109',
  인천: '109',
  경기: '109',
  강원: '105',
  충북: '131',
  대전: '133',
  세종: '133',
  충남: '133',
  전북: '146',
  광주: '156',
  전남: '156',
  대구: '143',
  경북: '143',
  부산: '159',
  울산: '159',
  경남: '159',
  제주: '184'
};

// 중기육상예보구역코드
export const landForecastRegions = {
  서울: '11B00000',
  인천: '11B00000',
  경기: '11B00000',
  강원영서: '11D10000',
  강원영동: '11D20000',
  대전: '11C20000',
  세종: '11C20000',
  충남: '11C20000',
  충북: '11C10000',
  광주: '11F20000',
  전남: '11F20000',
  전북: '11F10000',
  대구: '11H10000',
  경북: '11H10000',
  부산: '11H20000',
  울산: '11H20000',
  경남: '11H20000',
  제주: '11G00000'
};

// 중기기온예보구역코드 (주요 도시만)
export const temperatureRegions = {
  서울: '11B10101',
  인천: '11B20201',
  수원: '11B20601',
  파주: '11B20305',
  춘천: '11D10301',
  원주: '11D10401',
  강릉: '11D20501',
  대전: '11C20401',
  서산: '11C20101',
  세종: '11C20404',
  청주: '11C10301',
  제주: '11G00201',
  서귀포: '11G00401',
  광주: '11F20501',
  목포: '21F20801',
  여수: '11F20401',
  전주: '11F10201',
  군산: '21F10501',
  부산: '11H20201',
  울산: '11H20101',
  창원: '11H20301',
  대구: '11H10701',
  안동: '11H10501',
  포항: '11H10201'
};

// 중기해상예보구역코드
export const seaForecastRegions = {
  서해북부: '12A10000',
  서해중부: '12A20000',
  서해남부: '12A30000',
  남해서부: '12B10000',
  남해동부: '12B20000',
  동해남부: '12C10000',
  동해중부: '12C20000',
  동해북부: '12C30000',
  제주도: '12B10500',
  대화퇴: '12D00000',
  동중국해: '12E00000',
  규슈: '12F00000',
  연해주: '12G00000'
};

/**
 * 지역명으로 예보구역코드들을 반환하는 함수
 * @param {string} location - 지역명
 * @returns {object} 각종 예보구역코드 객체
 */
export function getRegionCodes(location) {
  // 기본값 설정 (서울)
  const defaultCodes = {
    outlookStation: '109',
    landForecastRegion: '11B00000',
    temperatureRegion: '11B10101',
    seaForecastRegion: '12A20000' // 서해중부
  };

  if (!location) {
    return defaultCodes;
  }

  // 지역명 정규화 (공백 제거, 소문자 변환)
  const normalizedLocation = location.trim();
  
  // 특별한 경우 처리
  let processedLocation = normalizedLocation;
  
  // 강원도의 경우 영서/영동 구분
  if (normalizedLocation.includes('강원')) {
    // 기본적으로 영서로 설정, 추후 더 정확한 구분 로직 추가 가능
    processedLocation = '강원영서';
  }
  
  // 경기도 처리
  if (normalizedLocation.includes('경기')) {
    processedLocation = '경기';
  }

  return {
    outlookStation: outlookStations[processedLocation] || 
                   outlookStations[normalizedLocation] || 
                   defaultCodes.outlookStation,
    
    landForecastRegion: landForecastRegions[processedLocation] || 
                       landForecastRegions[normalizedLocation] || 
                       defaultCodes.landForecastRegion,
    
    temperatureRegion: temperatureRegions[processedLocation] || 
                      temperatureRegions[normalizedLocation] || 
                      defaultCodes.temperatureRegion,
    
    seaForecastRegion: seaForecastRegions[processedLocation] || 
                      seaForecastRegions[normalizedLocation] || 
                      defaultCodes.seaForecastRegion
  };
}

/**
 * 지원되는 모든 지역 목록 반환
 * @returns {array} 지역명 배열
 */
export function getSupportedRegions() {
  return [
    '서울', '인천', '경기', '수원', '파주',
    '강원', '춘천', '원주', '강릉',
    '충북', '청주', '대전', '세종', '충남', '서산',
    '전북', '전주', '군산', '광주', '전남', '목포', '여수',
    '대구', '경북', '안동', '포항', '부산', '울산', '경남', '창원',
    '제주', '서귀포'
  ];
}

/**
 * 날씨 상태 한글명을 아이콘 키로 변환
 * @param {string} weatherCondition - 한글 날씨 상태
 * @returns {string} 아이콘 키
 */
export function getWeatherIconKey(weatherCondition) {
  if (!weatherCondition) return 'sunny';
  
  const condition = weatherCondition.toLowerCase();
  
  if (condition.includes('맑')) return 'sunny';
  if (condition.includes('구름많')) return 'partly-cloudy';
  if (condition.includes('흐림') || condition.includes('흐리')) return 'cloudy';
  if (condition.includes('비') || condition.includes('소나기')) return 'rainy';
  if (condition.includes('눈')) return 'snowy';
  
  return 'sunny'; // 기본값
}

/**
 * 날씨 상태 영문명 변환
 * @param {string} weatherCondition - 한글 날씨 상태
 * @returns {string} 영문 날씨 상태
 */
export function translateWeatherCondition(weatherCondition) {
  if (!weatherCondition) return 'Clear';
  
  const translations = {
    '맑음': 'Clear',
    '구름많음': 'Partly Cloudy',
    '흐림': 'Cloudy',
    '흐리고 비': 'Cloudy with Rain',
    '구름많고 비': 'Partly Cloudy with Rain',
    '비': 'Rainy',
    '소나기': 'Showers',
    '눈': 'Snow',
    '구름많고 눈': 'Partly Cloudy with Snow',
    '흐리고 눈': 'Cloudy with Snow'
  };
  
  return translations[weatherCondition] || weatherCondition;
}
