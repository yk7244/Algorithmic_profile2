'use client'

import { useState } from 'react'
import supabase from '@/lib/supabase'

export default function TestProfilePage() {
  const [status, setStatus] = useState('')

  async function createProfile() {
    const { data: userData, error: authError } = await supabase.auth.getUser()
    const uid = userData?.user?.id
    if (!uid) {
      setStatus('로그인 안 됨')
      return
    }

    const { error } = await supabase.from('ProfileData').insert({
      id: uid,
      nickname: '테스트유저',
      description: '나는 누구인가',
      avatar_url: 'https://placekitten.com/200/200',
    })

    if (error) {
      console.error(error)
      setStatus('삽입 실패')
    } else {
      setStatus('Profile inserted!')
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">🧪 프로필 생성 테스트</h1>
      <button
        onClick={createProfile}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        프로필 만들기
      </button>
      {status && <p className="mt-4">{status}</p>}
    </div>
  )
}
