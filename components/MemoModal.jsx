"use client"

import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "../lib/utils"
import { useIsMobile } from "../hooks/use-mobile"
import { Button } from "../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "../components/ui/drawer"
import { Calendar, Trash2, Save } from "lucide-react"
import { useAuth } from "../hooks/useAuth"

const colorOptions = [
  { value: 'blue', label: '파란색', class: 'bg-blue-100 border-blue-300' },
  { value: 'green', label: '초록색', class: 'bg-green-100 border-green-300' },
  { value: 'yellow', label: '노란색', class: 'bg-yellow-100 border-yellow-300' },
  { value: 'red', label: '빨간색', class: 'bg-red-100 border-red-300' },
  { value: 'purple', label: '보라색', class: 'bg-purple-100 border-purple-300' },
  { value: 'gray', label: '회색', class: 'bg-gray-100 border-gray-300' }
];

export function MemoModal({ open, onOpenChange, selectedDate, onMemoUpdate }) {
  const [memo, setMemo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: 'blue'
  });

  const modalContentRef = useRef(null);

  const isMobile = useIsMobile();
  const isDesktop = !isMobile;
  const { user } = useAuth();

  // 메모 불러오기
  const loadMemo = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/memos?date=${selectedDate}`);
      const data = await response.json();

      if (response.ok && data.memo) {
        setMemo(data.memo);
        setFormData({
          title: data.memo.title || '',
          content: data.memo.content || '',
          color: data.memo.color || 'blue'
        });
      } else {
        // 메모가 없는 경우 초기화
        setMemo(null);
        setFormData({
          title: '',
          content: '',
          color: 'blue'
        });
      }
    } catch (error) {
      console.error('메모 불러오기 실패:', error);
      setMemo(null);
      setFormData({
        title: '',
        content: '',
        color: 'blue'
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  // 선택된 날짜가 변경될 때 메모 불러오기
  useEffect(() => {
    if (open && selectedDate && user) {
      loadMemo();
    }
  }, [open, selectedDate, user, loadMemo]);

  // 개별 입력 핸들러들
  const handleTitleChange = useCallback((e) => {
    setFormData(prev => ({
      ...prev,
      title: e.target.value
    }));
  }, []);

  const handleContentChange = useCallback((e) => {
    setFormData(prev => ({
      ...prev,
      content: e.target.value
    }));
  }, []);

  const handleColorChange = useCallback((value) => {
    setFormData(prev => ({
      ...prev,
      color: value
    }));
  }, []);

  // 메모 저장/업데이트
  const handleSave = useCallback(async () => {
    if (!formData.content.trim()) {
      alert('메모 내용을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      
      const method = memo ? 'PUT' : 'POST';
      const response = await fetch('/api/memos', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          title: formData.title.trim(),
          content: formData.content.trim(),
          color: formData.color
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMemo(data.memo);
        onMemoUpdate?.(); // 캘린더 업데이트 콜백
        onOpenChange(false); // 모달 닫기
      } else {
        alert(data.error || '메모 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('메모 저장 실패:', error);
      alert('메모 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [formData, memo, selectedDate, onMemoUpdate, onOpenChange]);

  // 메모 삭제
  const handleDelete = useCallback(async () => {
    if (!memo || !confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/memos?date=${selectedDate}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMemo(null);
        setFormData({
          title: '',
          content: '',
          color: 'blue'
        });
        onMemoUpdate?.(); // 캘린더 업데이트 콜백
        onOpenChange(false); // 모달 닫기
      } else {
        const data = await response.json();
        alert(data.error || '메모 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('메모 삭제 실패:', error);
      alert('메모 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  }, [memo, selectedDate, onMemoUpdate, onOpenChange]);

  // 날짜 포맷팅
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  }, []);


  if (!user) {
    return null;
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="sm:max-w-[425px]"
        >
          <DialogHeader>
            <DialogTitle>
              {memo ? '메모 수정' : '새 메모 작성'}
            </DialogTitle>
            <DialogDescription>
              {formatDate(selectedDate)}에 대한 메모를 {memo ? '수정' : '작성'}하세요.
            </DialogDescription>
          </DialogHeader>
          {isLoading && !memo ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">메모를 불러오는 중...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 날짜 표시 */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(selectedDate)}</span>
              </div>

              {/* 제목 입력 */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  제목 (선택사항)
                </label>
                <input
                  id="title"
                  type="text"
                  placeholder="메모 제목을 입력하세요"
                  value={formData.title}
                  onChange={handleTitleChange}
                  maxLength={100}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 메모 내용 */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  메모 내용 *
                </label>
                <textarea
                  id="content"
                  placeholder="메모 내용을 입력하세요"
                  value={formData.content}
                  onChange={handleContentChange}
                  maxLength={1000}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-xs text-gray-400 text-right mt-1">
                  {formData.content.length}/1000
                </div>
              </div>

              {/* 버튼들 */}
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={handleSave} 
                  disabled={isLoading || !formData.content.trim()}
                  className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? '저장 중...' : memo ? '수정' : '저장'}
                </Button>
                
                {memo && (
                  <Button 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="h-10 px-4"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>
            {memo ? '메모 수정' : '새 메모 작성'}
          </DrawerTitle>
          <DrawerDescription>
            {formatDate(selectedDate)}에 대한 메모를 {memo ? '수정' : '작성'}하세요.
          </DrawerDescription>
        </DrawerHeader>
        {isLoading && !memo ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">메모를 불러오는 중...</div>
          </div>
        ) : (
          <div className="px-4 space-y-4">
            {/* 날짜 표시 */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(selectedDate)}</span>
            </div>

            {/* 제목 입력 */}
            <div>
              <label htmlFor="title-mobile" className="block text-sm font-medium text-gray-700 mb-1">
                제목 (선택사항)
              </label>
              <input
                id="title-mobile"
                type="text"
                placeholder="메모 제목을 입력하세요"
                value={formData.title}
                onChange={handleTitleChange}
                maxLength={100}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 메모 내용 */}
            <div>
              <label htmlFor="content-mobile" className="block text-sm font-medium text-gray-700 mb-1">
                메모 내용 *
              </label>
              <textarea
                id="content-mobile"
                placeholder="메모 내용을 입력하세요"
                value={formData.content}
                onChange={handleContentChange}
                maxLength={1000}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-xs text-gray-400 text-right mt-1">
                {formData.content.length}/1000
              </div>
            </div>

            {/* 버튼들 */}
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleSave} 
                disabled={isLoading || !formData.content.trim()}
                className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? '저장 중...' : memo ? '수정' : '저장'}
              </Button>
              
              {memo && (
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="h-10 px-4"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">닫기</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
