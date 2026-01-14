import { useState } from 'react';
import { loadPlayerDetail } from '@/src/lib/dataLoader';
import type { Player } from '@/src/types';

interface UsePlayerModalResult {
  isOpen: boolean;
  player: Player | null;
  loading: boolean;
  error: string | null;
  openModal: (playerId: string) => Promise<void>;
  closeModal: () => void;
}

/**
 * 球員 Modal 狀態管理 Hook
 *
 * 提供 Modal 的開關控制、球員資料載入和狀態管理功能。
 *
 * @returns Modal 狀態和控制函數
 *
 * @example
 * ```tsx
 * const { isOpen, player, loading, error, openModal, closeModal } = usePlayerModal();
 *
 * // 開啟 Modal 並載入球員資料
 * <button onClick={() => openModal('COL064')}>查看球員</button>
 *
 * // 顯示 Modal
 * {isOpen && player && (
 *   <PlayerModal player={player} onClose={closeModal} />
 * )}
 *
 * // 顯示載入中
 * {loading && <div>載入中...</div>}
 *
 * // 顯示錯誤
 * {error && <div>錯誤：{error}</div>}
 * ```
 */
export function usePlayerModal(): UsePlayerModalResult {
  const [isOpen, setIsOpen] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 開啟 Modal 並載入球員資料
   *
   * @param playerId - 球員 ID
   */
  const openModal = async (playerId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const data = await loadPlayerDetail(playerId);

      setPlayer(data);
      setIsOpen(true);
    } catch (err) {
      // 處理錯誤，支援 Error 物件和其他型別
      setError(err instanceof Error ? err.message : String(err));
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 關閉 Modal 並清空狀態
   */
  const closeModal = (): void => {
    setIsOpen(false);
    setPlayer(null);
    setError(null);
  };

  return {
    isOpen,
    player,
    loading,
    error,
    openModal,
    closeModal,
  };
}
