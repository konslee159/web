"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Eye, EyeOff, User, MapPin, ThermometerSun, Bell } from 'lucide-react';

export default function UpdateAccountPage() {
  const router = useRouter();
  const { user, loading, checkAuth } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    location: '서울',
    temperatureUnit: 'celsius',
    notifications: true,
    currentPassword: '',
    newPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        setFormData((prev) => ({
          ...prev,
          name: user.name || '',
          location: user.location || '서울',
          temperatureUnit: user.preferences?.temperatureUnit || 'celsius',
          notifications: typeof user.preferences?.notifications === 'boolean' ? user.preferences.notifications : true
        }));
      }
    }
  }, [user, loading, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {} as any;
    if (!formData.name.trim()) newErrors.name = '이름을 입력해주세요.';
    if (formData.newPassword && !formData.currentPassword) newErrors.currentPassword = '현재 비밀번호를 입력해주세요.';
    if (formData.currentPassword && !formData.newPassword) newErrors.newPassword = '새 비밀번호를 입력해주세요.';
    if (formData.newPassword) {
      const pw = formData.newPassword;
      const hasMin = pw.length >= 6;
      const hasLower = /[a-z]/.test(pw);
      const hasUpper = /[A-Z]/.test(pw);
      const hasDigit = /\d/.test(pw);
      if (!(hasMin && hasLower && hasUpper && hasDigit)) {
        newErrors.newPassword = '비밀번호는 대문자, 소문자, 숫자를 포함하여 6자 이상이어야 합니다.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    setMessage('');
    try {
      const payload: any = {};
      if (formData.name !== user?.name) payload.name = formData.name.trim();
      if (formData.location !== user?.location) payload.location = formData.location;
      // 환경 설정은 settings 페이지에서 업데이트
      if (formData.currentPassword && formData.newPassword) {
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }

      if (Object.keys(payload).length === 0) {
        setMessage('변경할 항목이 없습니다.');
        return;
      }

      const res = await fetch('/api/auth/update_account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('계정 정보가 업데이트되었습니다.');
        setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
        await checkAuth();
        router.push('/');
      } else if (data.details) {
        const serverErrors = {} as any;
        data.details.forEach((d) => {
          serverErrors[d.field] = d.message;
        });
        setErrors(serverErrors);
        setMessage(data.error || '업데이트 중 오류가 발생했습니다.');
      } else {
        setMessage(data.error || '업데이트 중 오류가 발생했습니다.');
      }
    } catch (err) {
      setMessage('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const locations = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">계정 설정</CardTitle>
          <CardDescription className="text-center">이름, 지역, 선호 설정 및 비밀번호를 변경할 수 있습니다</CardDescription>
        </CardHeader>
        <CardContent className="">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 이름 */}
              <div className="space-y-2">
                <Label htmlFor="name" className="">이름</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="홍길동"
                    value={formData.name}
                    onChange={handleChange}
                    className={`pl-10 ${errors['name'] ? 'border-red-500' : ''}`}
                    disabled={submitting}
                  />
                </div>
                {errors['name'] && <p className="text-sm text-red-500">{errors['name'] as any}</p>}
              </div>

              {/* 지역 */}
              <div className="space-y-2">
                <Label htmlFor="location" className="">선호 지역</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                  <Select value={formData.location} onValueChange={(value) => setFormData((p) => ({ ...p, location: value }))}>
                    <SelectTrigger className="pl-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="">
                      {locations.map((loc) => (
                        <SelectItem key={loc} value={loc} className="">{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 환경 설정은 설정 페이지에서 관리합니다 */}

            {/* 비밀번호 변경 */}
            <div className="space-y-2">
              <Label className="">비밀번호 변경 (선택)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="현재 비밀번호"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className={`${errors['currentPassword'] ? 'border-red-500 pr-20' : 'pr-20'}`}
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((s) => !s)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {errors['currentPassword'] && (
                    <p className="text-sm text-red-500 mt-2">{errors['currentPassword'] as any}</p>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="새 비밀번호 (대문자, 소문자, 숫자 포함 6자 이상)"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={`${errors['newPassword'] ? 'border-red-500 pr-20' : 'pr-20'}`}
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((s) => !s)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {errors['newPassword'] && (
                    <p className="text-sm text-red-500 mt-2">{errors['newPassword'] as any}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 메시지 */}
            {message && (
              <Alert variant="default" className={message.includes('업데이트') ? 'border-green-500 bg-green-50' : ''}>
                <AlertDescription className="">{message}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" size="default" className="" onClick={() => router.push('/')}>취소</Button>
              <Button type="submit" variant="default" size="default" className="" disabled={submitting}>{submitting ? '저장 중...' : '저장하기'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


