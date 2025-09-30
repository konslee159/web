import { Card, CardContent } from "./ui/card";
import { Cloud, Sun, CloudRain, CloudSnow, Droplets, Wind, Eye, Thermometer, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

const getWeatherIcon = (condition) => {
  switch (condition.toLowerCase()) {
    case "sunny":
    case "clear":
      return <Sun className="w-16 h-16 text-yellow-500" />;
    case "cloudy":
    case "partly cloudy":
      return <Cloud className="w-16 h-16 text-gray-500" />;
    case "rainy":
    case "rain":
    case "cloudy with rain":
    case "partly cloudy with rain":
      return <CloudRain className="w-16 h-16 text-blue-500" />;
    case "snowy":
    case "snow":
    case "cloudy with snow":
    case "partly cloudy with snow":
      return <CloudSnow className="w-16 h-16 text-blue-200" />;
    default:
      return <Sun className="w-16 h-16 text-yellow-500" />;
  }
};

export function WeatherCard({ weather, loading = false, error = null, onRefresh = null }) {
  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">날씨 정보를 불러오는 중...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-red-600 mb-4">날씨 정보를 불러올 수 없습니다</p>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            {onRefresh && (
              <Button onClick={onRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 시도
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-8">
          <div className="flex items-center justify-center h-64">
            <span className="text-gray-500">날씨 정보가 없습니다</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardContent className="p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl">{weather.location}</h2>
            {onRefresh && (
              <Button
                onClick={onRefresh}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-4 mb-4">
            {getWeatherIcon(weather.condition)}
            <span className="text-6xl">{weather.temperature}°</span>
          </div>
          <p className="text-xl text-muted-foreground">{weather.condition}</p>
          <p className="text-sm text-muted-foreground">체감온도 {weather.feelsLike}°</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">습도</p>
              <p>{weather.humidity}%</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-muted-foreground">풍속</p>
              <p>{weather.windSpeed} km/h</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">가시거리</p>
              <p>{weather.visibility} km</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">기압</p>
              <p>1013 hPa</p>
            </div>
          </div>
        </div>

        {/* 기상전망 정보 추가 */}
        {weather.outlook && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">기상전망</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{weather.outlook}</p>
          </div>
        )}

        {/* 마지막 업데이트 시간 */}
        {weather.lastUpdate && (
          <div className="text-xs text-gray-400 text-center mt-4">
            마지막 업데이트: {new Date(weather.lastUpdate).toLocaleString('ko-KR')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
