import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Search, MapPin, Info } from "lucide-react";
import { getSupportedRegions } from "../lib/regionCodes";

// 기상청 API에서 지원하는 주요 지역들
const popularLocations = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "제주", 
  "춘천", "강릉", "청주", "전주", "창원", "포항"
];

const supportedRegions = getSupportedRegions();

export function SearchLocation({ onLocationSelect }) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    if (searchTerm.trim()) {
      const location = searchTerm.trim();
      // 지원되는 지역인지 확인
      if (supportedRegions.includes(location) || popularLocations.includes(location)) {
        onLocationSelect(location);
        setSearchTerm("");
      } else {
        // 가장 유사한 지역 찾기 (간단한 포함 검색)
        const similarRegion = supportedRegions.find(region => 
          region.includes(location) || location.includes(region)
        );
        if (similarRegion) {
          onLocationSelect(similarRegion);
          setSearchTerm("");
        } else {
          alert(`"${location}"은 지원되지 않는 지역입니다. 지원되는 지역을 선택해주세요.`);
        }
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 검색어에 따른 필터링된 지역 제안
  const filteredSuggestions = searchTerm 
    ? supportedRegions.filter(region => 
        region.includes(searchTerm) || region.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="relative">
            <div className="flex gap-2">
              <Input
                placeholder="도시명을 입력하세요..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="icon">
                <Search className="w-4 h-4" />
              </Button>
            </div>
            
            {/* 검색 제안 */}
            {filteredSuggestions.length > 0 && searchTerm && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-md shadow-lg">
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
                    onClick={() => {
                      onLocationSelect(suggestion);
                      setSearchTerm("");
                    }}
                  >
                    <MapPin className="w-3 h-3 inline mr-2" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">주요 도시</p>
            <div className="flex flex-wrap gap-2">
              {popularLocations.map((location) => (
                <Button
                  key={location}
                  variant="outline"
                  size="sm"
                  onClick={() => onLocationSelect(location)}
                  className="text-xs"
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  {location}
                </Button>
              ))}
            </div>
          </div>

          {/* 지원 지역 안내 */}
          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-3 h-3 mt-0.5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800 mb-1">기상청 중기예보 지원 지역</p>
                <p className="text-blue-700">
                  총 {supportedRegions.length}개 지역의 실시간 중기예보를 제공합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
