import { Card, CardContent } from "./ui/card";
import { Cloud, Sun, CloudRain, CloudSnow, Droplets, RefreshCw } from "lucide-react";

const getWeatherIcon = (condition, size = "w-8 h-8") => {
  const iconClass = `${size} mx-auto`;
  
  switch (condition.toLowerCase()) {
    case "sunny":
    case "clear":
      return <Sun className={`${iconClass} text-yellow-500`} />;
    case "cloudy":
    case "partly cloudy":
      return <Cloud className={`${iconClass} text-gray-500`} />;
    case "rainy":
    case "rain":
    case "cloudy with rain":
    case "partly cloudy with rain":
      return <CloudRain className={`${iconClass} text-blue-500`} />;
    case "snowy":
    case "snow":
    case "cloudy with snow":
    case "partly cloudy with snow":
      return <CloudSnow className={`${iconClass} text-blue-200`} />;
    default:
      return <Sun className={`${iconClass} text-yellow-500`} />;
  }
};

export function ForecastCard({ forecast, forecastData = null, temperatureData = null, loading = false }) {
  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-6">
          <h3 className="text-xl mb-6">중기 예보</h3>
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">예보 정보를 불러오는 중...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!forecast || forecast.length === 0) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-6">
          <h3 className="text-xl mb-6">중기 예보</h3>
          <div className="text-center text-gray-500 py-8">
            예보 정보가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl">중기 예보</h3>
          {temperatureData?.tmFc && (
            <span className="text-sm text-gray-500">
              {temperatureData.tmFc.slice(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, '$1년 $2월 $3일')} 
              {temperatureData.tmFc.slice(8, 10)}시 발표
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {forecast.map((day, index) => {
            // 강수확률 정보 찾기
            const dayForecast = forecastData?.forecast?.find(f => f.day === (index + 4));
            const rainProbability = dayForecast?.afternoon?.rainProbability || 
                                  dayForecast?.daily?.rainProbability ||
                                  dayForecast?.morning?.rainProbability;

            return (
              <Card key={index} className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:shadow-lg transition-all duration-200 hover:scale-105">
                <CardContent className="p-4 text-center">
                  <div className="space-y-3">
                    {/* 날짜 정보 */}
                    <div>
                      <p className="font-medium text-gray-900">{day.day}</p>
                      <p className="text-sm text-muted-foreground">{day.date}</p>
                    </div>
                    
                    {/* 날씨 아이콘 */}
                    <div className="flex justify-center py-2">
                      {getWeatherIcon(day.condition, "w-12 h-12")}
                    </div>
                    
                    {/* 날씨 상태 */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{day.condition}</p>
                      {rainProbability && (
                        <div className="flex items-center justify-center gap-1">
                          <Droplets className="w-3 h-3 text-blue-500" />
                          <span className="text-xs text-blue-600">{rainProbability}%</span>
                        </div>
                      )}
                    </div>
                    
                    {/* 온도 */}
                    <div className="space-y-1">
                      <div className="flex justify-center items-center gap-2">
                        <span className="font-semibold text-lg text-red-600">{day.high}°</span>
                        <span className="text-blue-600">{day.low}°</span>
                      </div>
                      <p className="text-xs text-muted-foreground">최고 / 최저</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 추가 정보 표시 */}
        {forecastData?.tmFc && (
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-xs text-gray-500">
              ※ 기상청 중기예보 (4일~10일 후 예보) • 
              발표시각: {forecastData.tmFc.slice(8, 10)}시
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
