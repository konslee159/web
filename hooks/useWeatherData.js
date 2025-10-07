"use client";

import { useState, useEffect, useCallback } from 'react';
import { getRegionCodes, translateWeatherCondition, getWeatherIconKey } from '../lib/regionCodes';

/**
 * 기상청 중기예보 API 데이터를 가져오는 커스텀 훅
 */
export function useWeatherData(location = '서울') {
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [temperatureData, setTemperatureData] = useState(null);
  const [outlookData, setOutlookData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeatherData = useCallback(async (targetLocation) => {
    if (!targetLocation) return;
    
    setLoading(true);
    setError(null);

    try {
      const regionCodes = getRegionCodes(targetLocation);
      
      // 병렬로 API 호출
      const [forecastResponse, temperatureResponse, outlookResponse] = await Promise.allSettled([
        fetch(`/api/weather/mid-forecast?regId=${regionCodes.landForecastRegion}`),
        fetch(`/api/weather/mid-temperature?regId=${regionCodes.temperatureRegion}`),
        fetch(`/api/weather/mid-outlook?stnId=${regionCodes.outlookStation}`)
      ]);

      // 중기육상예보 데이터 처리
      let forecast = null;
      if (forecastResponse.status === 'fulfilled' && forecastResponse.value.ok) {
        let forecastJson = null;
        try {
          forecastJson = await forecastResponse.value.json();
        } catch (_) {}
        if (forecastJson?.success) {
          forecast = forecastJson.data;
        }
      }

      // 중기기온 데이터 처리
      let temperature = null;
      if (temperatureResponse.status === 'fulfilled' && temperatureResponse.value.ok) {
        let temperatureJson = null;
        try {
          temperatureJson = await temperatureResponse.value.json();
        } catch (_) {}
        if (temperatureJson?.success) {
          temperature = temperatureJson.data;
        }
      }

      // 중기전망 데이터 처리
      let outlook = null;
      if (outlookResponse.status === 'fulfilled' && outlookResponse.value.ok) {
        let outlookJson = null;
        try {
          outlookJson = await outlookResponse.value.json();
        } catch (_) {}
        if (outlookJson?.success) {
          outlook = outlookJson.data;
        }
      }

      // 통합 날씨 데이터 생성
      const combinedWeatherData = createCombinedWeatherData(
        targetLocation, 
        forecast, 
        temperature, 
        outlook
      );

      setWeatherData(combinedWeatherData);
      setForecastData(forecast);
      setTemperatureData(temperature);
      setOutlookData(outlook);

    } catch (err) {
      console.error('날씨 데이터 가져오기 오류:', err);
      setError(err.message || '날씨 데이터를 가져오는 중 오류가 발생했습니다.');
      
      // 오류 발생 시 기본 데이터 설정
      setWeatherData(createFallbackWeatherData(targetLocation));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeatherData(location);
  }, [location, fetchWeatherData]);

  return {
    weatherData,
    forecastData,
    temperatureData,
    outlookData,
    loading,
    error,
    refetch: () => fetchWeatherData(location)
  };
}

/**
 * API 응답 데이터를 WeatherCard에서 사용할 형태로 변환
 */
function createCombinedWeatherData(location, forecast, temperature, outlook) {
  const today = new Date();
  
  // 오늘 날씨 정보 (단기예보가 없으므로 첫 번째 중기예보 데이터 사용)
  let currentCondition = 'Clear';
  let currentIcon = 'sunny';
  let currentTemp = 20;
  let feelsLike = 22;
  
  // 중기예보 첫 번째 데이터에서 현재 날씨 추정
  if (forecast?.forecast?.length > 0) {
    const firstForecast = forecast.forecast[0];
    const weatherCondition = firstForecast.morning?.weather || 
                           firstForecast.daily?.weather || 
                           '맑음';
    
    currentCondition = translateWeatherCondition(weatherCondition);
    currentIcon = getWeatherIconKey(weatherCondition);
  }
  
  // 중기기온 첫 번째 데이터에서 현재 기온 추정
  if (temperature?.temperatures?.length > 0) {
    const firstTemp = temperature.temperatures[0];
    const minTemp = parseInt(firstTemp.minTemp?.temp) || 15;
    const maxTemp = parseInt(firstTemp.maxTemp?.temp) || 25;
    
    // 현재 시간 기준으로 기온 추정 (오전이면 최저+3도, 오후면 최고-2도)
    const currentHour = today.getHours();
    if (currentHour < 14) {
      currentTemp = minTemp + 3;
    } else {
      currentTemp = maxTemp - 2;
    }
    
    feelsLike = currentTemp + 2;
  }

  // 5일 예보 생성 (중기예보 + 기온 데이터 조합)
  const forecastList = [];
  
  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    let dayName, displayDate;
    if (i === 0) {
      dayName = '오늘';
    } else if (i === 1) {
      dayName = '내일';
    } else {
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      dayName = `${dayNames[date.getDay()]}요일`;
    }
    
    displayDate = `${date.getMonth() + 1}월 ${date.getDate()}일`;
    
    // 해당 날짜의 예보 데이터 찾기
    let weatherCondition = '맑음';
    let high = 25;
    let low = 15;
    
    // 중기예보에서 해당 일의 데이터 찾기 (4일 후부터 시작)
    const forecastDay = i + 4; // 4일 후부터 8일 후까지
    if (forecast?.forecast) {
      const dayForecast = forecast.forecast.find(f => f.day === forecastDay);
      if (dayForecast) {
        weatherCondition = dayForecast.afternoon?.weather || 
                          dayForecast.daily?.weather || 
                          dayForecast.morning?.weather || 
                          '맑음';
      }
    }
    
    // 중기기온에서 해당 일의 데이터 찾기
    if (temperature?.temperatures) {
      const tempForecast = temperature.temperatures.find(t => t.day === forecastDay);
      if (tempForecast) {
        high = parseInt(tempForecast.maxTemp?.temp) || 25;
        low = parseInt(tempForecast.minTemp?.temp) || 15;
      }
    }
    
    forecastList.push({
      day: dayName,
      date: displayDate,
      condition: translateWeatherCondition(weatherCondition),
      high: high,
      low: low,
      icon: getWeatherIconKey(weatherCondition)
    });
  }

  return {
    location: location,
    temperature: currentTemp,
    condition: currentCondition,
    humidity: 65, // 기본값 (단기예보 API가 없어 추정)
    windSpeed: 8, // 기본값
    visibility: 10, // 기본값
    feelsLike: feelsLike,
    icon: currentIcon,
    forecast: forecastList,
    outlook: outlook?.outlook || '기상 전망 정보를 불러오는 중입니다.',
    lastUpdate: new Date().toISOString()
  };
}

/**
 * API 오류 시 사용할 기본 날씨 데이터
 */
function createFallbackWeatherData(location) {
  const today = new Date();
  const forecastList = [];
  
  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    let dayName;
    if (i === 0) dayName = '오늘';
    else if (i === 1) dayName = '내일';
    else {
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      dayName = `${dayNames[date.getDay()]}요일`;
    }
    
    forecastList.push({
      day: dayName,
      date: `${date.getMonth() + 1}월 ${date.getDate()}일`,
      condition: 'Clear',
      high: 25,
      low: 15,
      icon: 'sunny'
    });
  }

  return {
    location: location,
    temperature: 22,
    condition: 'Clear',
    humidity: 65,
    windSpeed: 8,
    visibility: 10,
    feelsLike: 24,
    icon: 'sunny',
    forecast: forecastList,
    outlook: '현재 날씨 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.',
    lastUpdate: new Date().toISOString()
  };
}
