'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Header from '@/components/admin/ui/Header';
import ConfirmDialog from '@/components/admin/ui/ConfirmDialog';
import { api } from '@/hooks/useApi';
import {
  RotateCcw,
  Trash2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Terminal,
  Code,
} from 'lucide-react';

interface SystemLogItem {
  id: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  category: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface LogApiResponse {
  data: SystemLogItem[];
  total: number;
  stats: {
    INFO: number;
    SUCCESS: number;
    WARN: number;
    ERROR: number;
  };
  logFilePath: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<SystemLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ INFO: 0, SUCCESS: 0, WARN: 0, ERROR: 0 });
  const [logFilePath, setLogFilePath] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Selected Log for JSON preview
  const [activeJson, setActiveJson] = useState<Record<string, unknown> | null>(null);

  // Clear confirm
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { limit: '100' };
      if (selectedLevel !== 'ALL') params.level = selectedLevel;
      if (selectedCategory !== 'ALL') params.category = selectedCategory;

      const res = await api.get<LogApiResponse>('/api/logs', params);
      setLogs(res.data || []);
      setTotal(res.total || 0);
      setStats(res.stats || { INFO: 0, SUCCESS: 0, WARN: 0, ERROR: 0 });
      setLogFilePath(res.logFilePath || '');
    } catch (err) {
      console.error('Lỗi tải nhật ký:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedLevel, selectedCategory]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClearLogs = async () => {
    setIsClearing(true);
    try {
      await api.delete('/api/logs');
      setIsConfirmOpen(false);
      await fetchLogs();
    } catch (err) {
      console.error('Lỗi xóa nhật ký:', err);
      alert('Không thể xóa nhật ký.');
    } finally {
      setIsClearing(false);
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            <CheckCircle2 className="w-3 h-3" />
            <span>SUCCESS</span>
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25">
            <XCircle className="w-3 h-3" />
            <span>ERROR</span>
          </span>
        );
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
            <AlertTriangle className="w-3 h-3" />
            <span>WARN</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">
            <Info className="w-3 h-3" />
            <span>INFO</span>
          </span>
        );
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div>
      <Header
        title="Nhật Ký Hoạt Động Hệ Thống"
        subtitle="Theo dõi quá trình migration, upload ảnh MinIO và các tác vụ hệ thống"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm mới</span>
            </button>
            <button
              onClick={() => setIsConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa nhật ký</span>
            </button>
          </div>
        }
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
        {/* Log File Path Box */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-slate-400">Đường dẫn file log trên máy chủ</p>
              <p className="text-xs sm:text-sm font-mono text-emerald-400 truncate mt-0.5">
                {logFilePath || 'logs/system.log'}
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 sm:text-right shrink-0">
            <span>Hiển thị 100 dòng mới nhất</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">TỔNG NHẬT KÝ</p>
              <p className="text-xl font-bold text-white mt-0.5">{total}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">THÀNH CÔNG</p>
              <p className="text-xl font-bold text-emerald-400 mt-0.5">{stats.SUCCESS}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">CẢNH BÁO</p>
              <p className="text-xl font-bold text-amber-400 mt-0.5">{stats.WARN}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">LỖI</p>
              <p className="text-xl font-bold text-red-400 mt-0.5">{stats.ERROR}</p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Cấp độ:</span>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Tất cả cấp độ</option>
                <option value="INFO">INFO</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Phân loại:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Tất cả phân loại</option>
                <option value="MIGRATION">MIGRATION (Chuyển đổi dữ liệu)</option>
                <option value="UPLOAD">UPLOAD (Tải ảnh MinIO)</option>
                <option value="CAR">CAR (Ô tô)</option>
                <option value="MOTORBIKE">MOTORBIKE (Xe máy)</option>
                <option value="BANNER">BANNER (Slider)</option>
                <option value="AUTH">AUTH (Xác thực)</option>
                <option value="SYSTEM">SYSTEM (Hệ thống)</option>
              </select>
            </div>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Hiển thị {logs.length} / {total} bản ghi
          </span>
        </div>

        {/* Logs Table */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3.5 w-44">Thời gian</th>
                  <th className="px-5 py-3.5 w-28">Cấp độ</th>
                  <th className="px-5 py-3.5 w-36">Phân loại</th>
                  <th className="px-5 py-3.5">Nội dung thông báo</th>
                  <th className="px-5 py-3.5 w-24 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300 font-mono">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                      Đang tải dữ liệu nhật ký...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                      Chưa có dữ liệu nhật ký nào phù hợp bộ lọc
                    </td>
                  </tr>
                ) : (
                  logs.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 text-slate-400 whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">{getLevelBadge(item.level)}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[11px]">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-200 font-sans text-sm">
                        {item.message}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {item.metadata && Object.keys(item.metadata).length > 0 ? (
                          <button
                            onClick={() => setActiveJson(item.metadata as Record<string, unknown>)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white transition-colors"
                            title="Xem chi tiết metadata JSON"
                          >
                            <Code className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* JSON Viewer Modal */}
      {activeJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-400" />
                <span>Chi tiết Metadata (JSON)</span>
              </h3>
              <button
                onClick={() => setActiveJson(null)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 rounded bg-slate-800"
              >
                Đóng
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-auto max-h-96 border border-slate-800">
              {JSON.stringify(activeJson, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Confirm Clear Modal */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Xác nhận xóa toàn bộ nhật ký"
        message="Hành động này sẽ xóa toàn bộ các bản ghi trong hệ thống và làm trống file log. Thao tác không thể hoàn tác."
        confirmText="Xác nhận xóa sạch"
        isLoading={isClearing}
        onConfirm={handleClearLogs}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
