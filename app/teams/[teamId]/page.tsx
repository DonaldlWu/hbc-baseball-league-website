'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { TeamHeader } from '@/src/components/TeamHeader';
import { PlayerCard } from '@/src/components/PlayerCard';
import { PlayerModal } from '@/src/components/PlayerModal';
import { getTeamPlayers, extractTeamsFromSeason, loadSeasonSummary, loadPlayerDetail, getTeamIcon } from '@/src/lib/dataLoader';
import type { TeamSummary, PlayerSummary, Player, SeasonSummary } from '@/src/types';

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 解碼 URL 參數（處理中文球團名稱）
  const teamId = decodeURIComponent(params.teamId as string);

  // 從 URL query params 取得年份，如果沒有則使用 2025（最新資料年份）
  const year = Number(searchParams.get('year')) || 2025;

  const [team, setTeam] = useState<TeamSummary | null>(null);
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // PlayerModal 狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // 載入球團資料
  useEffect(() => {
    async function loadTeamData() {
      setLoading(true);
      setError(null);

      try {
        // 載入球團資料
        const teamData = await getTeamPlayers(year, teamId);

        if (!teamData) {
          throw new Error('球團不存在');
        }

        // 載入完整的年度摘要來取得 TeamSummary
        const summary = await loadSeasonSummary(year);
        const teams = extractTeamsFromSeason(summary);
        const teamSummary = teams.find(t => t.teamId === teamId);

        if (!teamSummary) {
          throw new Error('無法載入球團資訊');
        }

        // 載入球隊圖標
        const iconUrl = await getTeamIcon(teamSummary.teamName);

        setTeam({ ...teamSummary, iconUrl });
        setPlayers(teamData.players);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadTeamData();
  }, [teamId, year]);

  // 點擊球員卡片
  const handlePlayerClick = async (player: PlayerSummary) => {
    setModalLoading(true);
    setIsModalOpen(true);

    try {
      const playerData = await loadPlayerDetail(player.id);
      setSelectedPlayer(playerData);
    } catch (err) {
      console.error('Failed to load player data:', err);
      setError(err as Error);
    } finally {
      setModalLoading(false);
    }
  };

  // 關閉 Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlayer(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">載入中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg bg-red-50 border border-red-200 p-6">
            <p className="text-red-800 font-semibold">載入失敗</p>
            <p className="mt-2 text-red-600">{error?.message || '球團不存在'}</p>
            <button
              onClick={() => router.push('/teams')}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              返回球團列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 球團標題 */}
      <TeamHeader team={team} />

      {/* 球員列表 */}
      <div className="mx-auto max-w-7xl px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">球員名單</h2>
          <button
            onClick={() => router.push('/teams')}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
          >
            ← 返回球團列表
          </button>
        </div>

        {players.length === 0 ? (
          <div className="rounded-lg bg-white border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">此球團目前沒有球員資料</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                onClick={handlePlayerClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* PlayerModal */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {/* Modal Loading 狀態 */}
      {modalLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="rounded-lg bg-white p-8 shadow-xl">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">載入球員資料...</p>
          </div>
        </div>
      )}
    </div>
  );
}
