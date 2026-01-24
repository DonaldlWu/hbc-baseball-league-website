"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

export default function GameDetailPage() {
  const params = useParams();
  const gameNumber = params.gameNumber as string;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* 返回連結 */}
        <div className="mb-6">
          <Link
            href="/#schedule"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            返回賽程表
          </Link>
        </div>

        {/* 比賽編號顯示 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              比賽戰報
            </h1>
            <div className="inline-block bg-primary-100 text-primary-800 text-2xl font-bold px-6 py-3 rounded-lg">
              {decodeURIComponent(gameNumber)}
            </div>
            <p className="mt-6 text-gray-500">
              戰報內容開發中...
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
