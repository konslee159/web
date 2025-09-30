"use client";

import { useState } from "react";
import { WeatherCard } from "../components/WeatherCard";
import { ForecastCard } from "../components/ForecastCard";
import { MonthlyCalendar } from "../components/MonthlyCalendar";
import { SearchLocation } from "../components/SearchLocation";
import { Navigation } from "../components/Navigation";
import { useAuth } from "../hooks/useAuth";
import { useWeatherData } from "../hooks/useWeatherData";

export default function Home() {
  const [currentLocation, setCurrentLocation] = useState("서울");
  const { user } = useAuth();
  
  // 실제 기상청 API 데이터 사용
  const { 
    weatherData, 
    forecastData, 
    temperatureData, 
    outlookData, 
    loading, 
    error, 
    refetch 
  } = useWeatherData(currentLocation);

  const handleLocationSelect = (location) => {
    setCurrentLocation(location);
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('https://images.unsplash.com/photo-1738977408886-13a59d1c4f58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGVhciUyMGJsdWUlMjBza3klMjBjbG91ZHMlMjB3ZWF0aGVyfGVufDF8fHx8MTc1ODAyOTYyNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`
      }}
    >
      {/* 네비게이션 */}
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl text-white mb-2">
            {user ? `안녕하세요, ${user.name}님!` : '날씨 정보'}
          </h1>
          <p className="text-xl text-white/80">
            {user ? `${user.location}의 실시간 날씨와 예보를 확인하세요` : '실시간 날씨와 예보를 확인하세요'}
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 검색 섹션 */}
            <div className="lg:col-span-1">
              <SearchLocation onLocationSelect={handleLocationSelect} />
            </div>

            {/* 현재 날씨 */}
            <div className="lg:col-span-2">
              <WeatherCard 
                weather={weatherData} 
                loading={loading}
                error={error}
                onRefresh={refetch}
              />
            </div>
          </div>

          {/* 중기 예보 */}
          <div className="mt-6">
            <ForecastCard 
              forecast={weatherData?.forecast}
              forecastData={forecastData}
              temperatureData={temperatureData}
              loading={loading}
            />
          </div>

          {/* 월별 달력 */}
          <div className="mt-6">
            <MonthlyCalendar location={currentLocation} />
          </div>
        </div>

        {/* 푸터 */}
        <div className="text-center mt-12 text-white/70">
          <p className="text-sm">
            ※ 이 웹사이트는 데모 목적으로 제작되었으며, 실제 날씨 데이터가 아닌 샘플 데이터를 사용합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
