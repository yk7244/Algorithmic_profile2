"use client";

import React from "react";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  const handleButtonClick = () => {
    if (isLoggedIn) {
      router.push('/upload/page_user');
    } else {
      router.push('/login');
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #232323 0%, #181818 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* 흐릿한 원형 배경 */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          height: 400,
          background: "radial-gradient(circle, #6b6b6b55 0%, #23232300 80%)",
          filter: "blur(20px)",
          zIndex: 1,
        }}
      />

      {/* 눈동자 */}
      <div
        style={{
          position: "absolute",
          top: "32%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          gap: 32,
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            background: "radial-gradient(circle, #fff 70%, #000 100%)",
            borderRadius: "50%",
            boxShadow: "0 0 32px 8px #fff8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              background: "#232323",
              borderRadius: "50%",
            }}
          />
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            background: "radial-gradient(circle, #fff 70%, #000 100%)",
            borderRadius: "50%",
            boxShadow: "0 0 32px 8px #fff8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              background: "#232323",
              borderRadius: "50%",
            }}
          />
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          marginTop: 180,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            color: "#fff",
            fontSize: 32,
            fontWeight: 700,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          유튜브 알고리즘은 나를 어떻게 보고 있을까?
        </h1>
        <p
          style={{
            color: "#b0b0b0",
            fontSize: 18,
            marginBottom: 40,
            textAlign: "center",
            fontWeight: 400,
          }}
        >
          <span style={{ color: "#fff", fontWeight: 600 }}></span>
          끌려다녔던 알고리즘의 흐름 속에서 벗어나, 나의 알고리즘의 흔적을 이해하고 정리해보세요.
        </p>
        <button
          onClick={handleButtonClick}
          style={{
            background: "#fff",
            color: "#181818",
            fontWeight: 700,
            fontSize: 20,
            border: "none",
            borderRadius: 32,
            padding: "16px 40px",
            cursor: "pointer",
            boxShadow: "0 2px 16px 0 #0002",
            transition: "background 0.2s",
          }}
        >
          나의 알고리즘 분석하기
        </button>
      </div>
    </main>
  );
} 