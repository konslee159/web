"use client";

import { createContext, useContext, useEffect, useState } from 'react';

// 인증 컨텍스트 생성
const AuthContext = createContext({});

/**
 * 인증 컨텍스트 프로바이더
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 사용자 정보 확인
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('인증 확인 에러:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 로그인 함수
  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error, details: data.details };
      }
    } catch (error) {
      console.error('로그인 에러:', error);
      return { success: false, error: '네트워크 오류가 발생했습니다.' };
    }
  };

  // 회원가입 함수
  const register = async (userData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message, user: data.user };
      } else {
        return { success: false, error: data.error, details: data.details };
      }
    } catch (error) {
      console.error('회원가입 에러:', error);
      return { success: false, error: '네트워크 오류가 발생했습니다.' };
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('로그아웃 에러:', error);
      setUser(null); // 로컬 상태는 초기화
      return { success: false, error: '로그아웃 중 오류가 발생했습니다.' };
    }
  };

  // 컴포넌트 마운트 시 인증 상태 확인
  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 인증 훅
 * @returns {Object} 인증 관련 상태와 함수들
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내에서 사용되어야 합니다.');
  }
  
  return context;
}
