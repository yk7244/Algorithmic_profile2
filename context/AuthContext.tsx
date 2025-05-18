'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = () => {
    // 실제 애플리케이션에서는 API 호출 등을 통해 로그인 처리 후 상태 변경
    setIsLoggedIn(true);
    console.log('User logged in, isLoggedIn:', true); // 로그인 상태 변경 로그
  };

  const logout = () => {
    // 실제 애플리케이션에서는 API 호출 등을 통해 로그아웃 처리 후 상태 변경
    setIsLoggedIn(false);
    console.log('User logged out, isLoggedIn:', false); // 로그아웃 상태 변경 로그
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 