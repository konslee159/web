"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { ThermometerSun, Bell, Languages } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [temperatureUnit, setTemperatureUnit] = useState('celsius');
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('ko');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      // 초기값 서버에서 불러오기
      (async () => {
        try {
          const res = await fetch('/api/setting', { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            setTemperatureUnit(data.settings.temperatureUnit || 'celsius');
            setNotifications(typeof data.settings.notifications === 'boolean' ? data.settings.notifications : true);
            setLanguage(data.settings.language || 'ko');
          }
        } catch (_) {}
      })();
    }
  }, [user, loading, router]);

  const handleSave = async () => {
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/setting', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ temperatureUnit, notifications, language })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('설정이 업데이트되었습니다.');
        router.push('/');
      } else {
        setMessage(data.error || '설정 업데이트 중 오류가 발생했습니다.');
      }
    } catch (e) {
      setMessage('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">설정</CardTitle>
          <CardDescription className="text-center">알림, 온도 단위, 언어를 설정합니다</CardDescription>
        </CardHeader>
        <CardContent className="">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 온도 단위 */}
              <div className="space-y-2">
                <Label className="">온도 단위</Label>
                <div className="relative">
                  <ThermometerSun className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Select value={temperatureUnit} onValueChange={setTemperatureUnit}>
                    <SelectTrigger className="pl-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="">
                      <SelectItem value="celsius" className="">섭씨 (°C)</SelectItem>
                      <SelectItem value="fahrenheit" className="">화씨 (°F)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 알림 설정 */}
              <div className="space-y-2">
                <Label className="block">알림</Label>
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-gray-400" />
                  <Switch checked={notifications} onCheckedChange={setNotifications} className="" />
                  <span className="text-sm text-gray-600">예보 알림 받기</span>
                </div>
              </div>
            </div>

            {/* 언어 설정 */}
            <div className="space-y-2">
              <Label className="">언어</Label>
              <div className="relative">
                <Languages className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="pl-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="">
                    <SelectItem value="ko" className="">한국어</SelectItem>
                    <SelectItem value="en" className="">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 메시지 */}
            {message && (
              <Alert variant="default" className="">
                <AlertDescription className="">{message}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" size="default" className="" onClick={() => router.push('/')}>취소</Button>
              <Button type="button" variant="default" size="default" className="" onClick={handleSave} disabled={submitting}>{submitting ? '저장 중...' : '저장하기'}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



