"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";

  const message = useMemo(() => {
    if (!token) return "초대 링크가 올바르지 않아요.";
    return "친구가 너와의 관계 팁을 받아보자고 초대했어.";
  }, [token]);

  const handleStart = () => {
    if (!token) {
      alert("초대 토큰이 없습니다.");
      return;
    }

    localStorage.setItem("inviteToken", token);
    router.push(`/?invite=${token}`);
  };

  return (
    <main className="min-h-screen p-8 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">친구 초대</h1>

      <div className="bg-yellow-50 p-4 rounded">
        <p className="mb-2">{message}</p>
        <p className="text-sm text-gray-600 break-all">token: {token}</p>
      </div>

      <div className="bg-gray-100 p-4 rounded space-y-3">
        <p>
          여기서 시작하면 네 정보로 새 리포트를 만들고, 나중에 친구와의 관계
          분석으로 연결할 수 있어.
        </p>

        <button
          onClick={handleStart}
          className="bg-black text-white px-4 py-2 rounded"
        >
          시작하기
        </button>
      </div>
    </main>
  );
}
