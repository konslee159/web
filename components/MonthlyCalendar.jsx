import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Cloud, Sun, CloudRain, CloudSnow, ChevronLeft, ChevronRight, Edit3, RefreshCw } from "lucide-react";
import { MemoModal } from "./MemoModal";
import { useAuth } from "../hooks/useAuth";
import { useWeatherData } from "../hooks/useWeatherData";
import { translateWeatherCondition, getWeatherIconKey } from "../lib/regionCodes";

const getWeatherIcon = (condition, size = "w-4 h-4") => {
  switch (condition.toLowerCase()) {
    case "sunny":
    case "clear":
      return <Sun className={`${size} text-yellow-500`} />;
    case "cloudy":
    case "partly cloudy":
    case "partly-cloudy":
      return <Cloud className={`${size} text-gray-500`} />;
    case "rainy":
    case "rain":
    case "cloudy with rain":
    case "partly cloudy with rain":
      return <CloudRain className={`${size} text-blue-500`} />;
    case "snowy":
    case "snow":
    case "cloudy with snow":
    case "partly cloudy with snow":
      return <CloudSnow className={`${size} text-blue-200`} />;
    default:
      return <Sun className={`${size} text-yellow-500`} />;
  }
};

// 중기예보 데이터를 활용한 달력 데이터 생성 함수
const generateCalendarData = (year, month, memos = [], forecastData = null, temperatureData = null) => {
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay()); // 일요일부터 시작
  
  const calendarDays = [];
  
  // 메모 데이터를 날짜별로 매핑
  const memosByDate = {};
  memos.forEach(memo => {
    memosByDate[memo.date] = memo;
  });
  
  // 42일(6주) 생성
  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    
    // 현재 날짜로부터 며칠 후인지 계산
    const daysDiff = Math.ceil((currentDate - today) / (1000 * 60 * 60 * 24));
    
    // 중기예보 데이터에서 해당 날짜의 날씨 정보 가져오기
    let weather = getWeatherForDate(daysDiff, forecastData, temperatureData);
    
    calendarDays.push({
      date: currentDate.getDate(),
      fullDate: dateString,
      isCurrentMonth: currentDate.getMonth() === month,
      isToday: currentDate.toDateString() === today.toDateString(),
      condition: weather.condition,
      high: weather.high,
      low: weather.low,
      memo: memosByDate[dateString] || null,
      daysDiff: daysDiff,
      hasWeatherData: weather.hasData
    });
  }
  
  return calendarDays;
};

// 특정 날짜의 날씨 정보를 가져오는 함수
const getWeatherForDate = (daysDiff, forecastData, temperatureData) => {
  // 기본값 설정
  let defaultWeather = {
    condition: "-",
    high: "-",
    low: "-",
    hasData: false
  };
  
  // 현재 날짜부터 10일 후까지 데이터 표시
  if (daysDiff >= 0 && daysDiff <= 10) {
    // 0~3일: 기본 추정값 표시
    if (daysDiff >= 0 && daysDiff <= 3) {
      // 현재~3일후는 기본값으로 표시 (실제 단기예보 API 없이)
      defaultWeather.condition = "Clear";
      defaultWeather.high = 25;
      defaultWeather.low = 15;
      defaultWeather.hasData = true;
    }
    // 4~10일: 중기예보 데이터 사용
    else if (daysDiff >= 4 && daysDiff <= 10) {
      // 중기육상예보에서 날씨 상태 가져오기
      const forecastDay = forecastData?.forecast?.find(f => f.day === daysDiff);
      if (forecastDay) {
        const weatherCondition = forecastDay.afternoon?.weather || 
                               forecastDay.daily?.weather || 
                               forecastDay.morning?.weather;
        
        if (weatherCondition) {
          defaultWeather.condition = translateWeatherCondition(weatherCondition);
          defaultWeather.hasData = true;
        }
      }
      
      // 중기기온예보에서 온도 정보 가져오기
      const tempDay = temperatureData?.temperatures?.find(t => t.day === daysDiff);
      if (tempDay) {
        defaultWeather.high = parseInt(tempDay.maxTemp?.temp) || "-";
        defaultWeather.low = parseInt(tempDay.minTemp?.temp) || "-";
        defaultWeather.hasData = true;
      }
    }
  }
  
  return defaultWeather;
};

const monthNames = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월"
];

const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

export function MonthlyCalendar({ location }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [memos, setMemos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  
  const { user } = useAuth();
  
  // 실제 기상청 API 데이터 가져오기
  const { 
    forecastData, 
    temperatureData, 
    loading: weatherLoading,
    error: weatherError,
    refetch: refetchWeather
  } = useWeatherData(location);
  
  const calendarData = generateCalendarData(currentYear, currentMonth, memos, forecastData, temperatureData);
  
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // 메모 데이터 로드
  const loadMemos = async () => {
    if (!user) return;
    
    try {
      const monthString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      const response = await fetch(`/api/memos?month=${monthString}`);
      const data = await response.json();
      
      if (response.ok && data.memos) {
        setMemos(data.memos);
      } else {
        setMemos([]);
      }
    } catch (error) {
      console.error('메모 데이터 로드 실패:', error);
      setMemos([]);
    }
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (day) => {
    if (!day.isCurrentMonth || !user) return;
    
    setSelectedDate(day.fullDate);
    setIsModalOpen(true);
  };

  // 메모 업데이트 후 콜백
  const handleMemoUpdate = () => {
    loadMemos(); // 메모 데이터 다시 로드
  };

  // 컴포넌트 마운트 시와 월/년도 변경 시 메모 로드
  useEffect(() => {
    loadMemos();
  }, [user, currentYear, currentMonth]);

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardContent className="p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-xl">{location} - {currentYear}년 {monthNames[currentMonth]}</h3>
            {weatherLoading && (
              <RefreshCw className="w-4 h-4 animate-spin text-gray-500" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {weatherError && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={refetchWeather}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                새로고침
              </Button>
            )}
            <Button 
              variant="outline" 
              size="icon"
              onClick={goToPreviousMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={goToNextMonth}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* 달력 본체 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarData.map((day, index) => (
            <div
              key={index}
              onClick={() => handleDateClick(day)}
              className={`
                group min-h-[80px] p-1 border border-gray-100 rounded-lg relative
                ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50/50'}
                ${day.isToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                ${day.memo ? 'ring-1 ring-green-400 bg-green-50/30' : ''}
                ${day.hasWeatherData ? 'ring-1 ring-orange-300 bg-orange-50/20' : ''}
                ${day.isCurrentMonth && user ? 'hover:bg-blue-50/50 cursor-pointer' : 'cursor-default'}
                transition-colors
              `}
            >
              {/* 날짜 */}
              <div className={`
                text-sm mb-1 ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                ${day.isToday ? 'font-bold text-blue-600' : ''}
              `}>
                {day.date}
              </div>
              
              {day.isCurrentMonth && (
                <div className="space-y-1">
                  {/* 날씨 아이콘 */}
                  <div className="flex justify-center">
                    {day.condition === "-" ? (
                      <div className="w-4 h-4 flex items-center justify-center text-gray-400">-</div>
                    ) : (
                      getWeatherIcon(day.condition)
                    )}
                  </div>
                  
                  {/* 온도 */}
                  <div className="text-center">
                    <div className="text-xs">
                      {day.high === "-" || day.low === "-" ? (
                        <span className="text-gray-400">- / -</span>
                      ) : (
                        <>
                          <span className="font-medium text-gray-900">{day.high}°</span>
                          <span className="text-gray-500 ml-1">{day.low}°</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* 날씨 상태 (작은 텍스트) */}
                  <div className="text-center">
                    <span className={`text-xs truncate block ${day.hasWeatherData ? 'text-orange-700 font-medium' : 'text-gray-600'}`}>
                      {day.condition === "-" ? "-" :
                       day.condition === "Partly Cloudy" ? "구름" : 
                       day.condition === "Clear" ? "맑음" :
                       day.condition === "Sunny" ? "맑음" :
                       day.condition === "Cloudy" ? "흐림" :
                       day.condition === "Rainy" ? "비" :
                       day.condition === "Cloudy with Rain" ? "흐리고 비" :
                       day.condition === "Partly Cloudy with Rain" ? "구름비" : 
                       day.condition}
                    </span>
                    {day.hasWeatherData && day.daysDiff >= 1 && day.daysDiff <= 10 && (
                      <div className="text-xs text-orange-600 mt-0.5">
                        +{day.daysDiff}일
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* 메모 인디케이터 */}
              {day.memo && day.isCurrentMonth && (
                <div className="absolute top-1 right-1">
                  <div className={`
                    w-2 h-2 rounded-full
                    ${day.memo.color === 'blue' ? 'bg-blue-400' :
                      day.memo.color === 'green' ? 'bg-green-400' :
                      day.memo.color === 'yellow' ? 'bg-yellow-400' :
                      day.memo.color === 'red' ? 'bg-red-400' :
                      day.memo.color === 'purple' ? 'bg-purple-400' :
                      'bg-gray-400'}
                  `} />
                </div>
              )}
              
              {/* 클릭 가능한 날짜에 편집 아이콘 표시 (호버 시) */}
              {day.isCurrentMonth && user && (
                <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit3 className="w-3 h-3 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* 범례 */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>
            <span>오늘</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-white border border-gray-200 rounded"></div>
            <span>이번 달</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-50 border border-gray-100 rounded"></div>
            <span>다른 달</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-50 border border-orange-200 rounded"></div>
            <span>중기예보</span>
          </div>
          {user && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div>
              <span>메모 있음</span>
            </div>
          )}
        </div>
        
        {/* 중기예보 정보 안내 */}
        {(forecastData || temperatureData) && (
          <div className="mt-3 text-center">
            <p className="text-xs text-orange-700 bg-orange-50 p-2 rounded">
              ※ 기상청 날씨 데이터: 오늘~3일(추정) + 4일~10일(중기예보)
              {temperatureData?.tmFc && (
                <span className="block mt-1">
                  발표시각: {temperatureData.tmFc.slice(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, '$1년 $2월 $3일')} {temperatureData.tmFc.slice(8, 10)}시
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
      
      {/* 메모 모달 */}
      <MemoModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        selectedDate={selectedDate}
        onMemoUpdate={handleMemoUpdate}
      />
    </Card>
  );
}
