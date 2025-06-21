
"use client";

import React from "react";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Introduction() {
const { isLoggedIn } = useAuth();
const router = useRouter();



return (
<div>
    <h1>TubeLens이란?</h1>
    <p>
        TubeLens은 유튜브 시청 기록을 기반으로 사용자의 관심사와 성향을 분석하여 
        새로운 관점의 프로필을 제공하는 서비스입니다.
    </p>
    <p>
        
    </p>
</div>
);
} 