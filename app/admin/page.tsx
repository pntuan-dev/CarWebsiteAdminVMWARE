'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/admin/ui/Header';
import {
  Car,
  Bike,
  Images,
  Layers,
  Tag,
  Plus,
  ArrowRight,
  Database,
  HardDrive,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/hooks/useApi';

interface DashboardStats {
  cars: number;
  motorbikes: number;
  banners: number;
  ecosystem: number;
  promotions: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    cars: 0,
    motorbikes: 0,
    banners: 0,
    ecosystem: 0,
    promotions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [carsRes, bikesRes, bannersRes, ecoRes, promoRes] = await Promise.all([
          api.get<{ total: number }>('/api/cars?activeOnly=false').catch(() => ({ total: 0 })),
          api.get<{ total: number }>('/api/motorbikes?activeOnly=false').catch(() => ({ total: 0 })),
          api.get<{ total: number }>('/api/banners?activeOnly=false').catch(() => ({ total: 0 })),
          api.get<{ total: number }>('/api/ecosystem?activeOnly=false').catch(() => ({ total: 0 })),
          api.get<{ total: number }>('/api/promotions?activeOnly=false').catch(() => ({ total: 0 })),
        ]);

        setStats({
          cars: carsRes.total || 0,
          motorbikes: bikesRes.total || 0,
          banners: bannersRes.total || 0,
          ecosystem: ecoRes.total || 0,
          promotions: promoRes.total || 0,
        });
      } catch (e) {
        console.error('Lỗi tải thống kê dashboard:', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, []);

  const statCards = [
    {
      title: 'Ô tô điện',
      count: stats.cars,
      icon: Car,
      color: 'blue',
      href: '/admin/cars',
      newHref: '/admin/cars/new',
      bgGlow: 'from-blue-600/20 to-transparent',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Xe máy điện',
      count: stats.motorbikes,
      icon: Bike,
      color: 'emerald',
      href: '/admin/motorbikes',
      newHref: '/admin/motorbikes/new',
      bgGlow: 'from-emerald-600/20 to-transparent',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
    },
    {
      title: 'Banner Slider',
      count: stats.banners,
      icon: Images,
      color: 'indigo',
      href: '/admin/banners',
      newHref: '/admin/banners/new',
      bgGlow: 'from-indigo-600/20 to-transparent',
      borderColor: 'border-indigo-500/30',
      iconColor: 'text-indigo-400',
    },
    {
      title: 'Hệ sinh thái',
      count: stats.ecosystem,
      icon: Layers,
      color: 'purple',
      href: '/admin/ecosystem',
      newHref: '/admin/ecosystem/new',
      bgGlow: 'from-purple-600/20 to-transparent',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400',
    },
    {
      title: 'Chương trình ưu đãi',
      count: stats.promotions,
      icon: Tag,
      color: 'amber',
      href: '/admin/promotions',
      newHref: '/admin/promotions/new',
      bgGlow: 'from-amber-600/20 to-transparent',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-400',
    },
  ];

  return (
    <div>
      <Header
        title="Tổng quan hệ thống"
        subtitle="Quản lý và cập nhật dữ liệu hiển thị trên VinFast Landing Page"
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`relative bg-slate-900 border ${card.borderColor} rounded-2xl p-6 overflow-hidden shadow-xl shadow-black/20 flex flex-col justify-between`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${card.bgGlow} rounded-full blur-2xl pointer-events-none`} />

                <div>
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center ${card.iconColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <Link
                      href={card.newHref}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm</span>
                    </Link>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {card.title}
                    </p>
                    <p className="text-3xl font-black text-white mt-1">
                      {isLoading ? '...' : card.count}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80">
                  <Link
                    href={card.href}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <span>Xem danh sách chi tiết</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* System & Infrastructure Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Infrastructure Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white tracking-tight mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              <span>Hạ tầng & Dịch vụ liên kết</span>
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">PostgreSQL Database</p>
                    <p className="text-xs text-slate-400">192.168.247.130:5432 (appdb)</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Kết nối</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">MinIO Storage</p>
                    <p className="text-xs text-slate-400">Bucket: websitecar (Port 9000)</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Hoạt động</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight mb-4 flex items-center gap-2">
                <span>Thao tác nhanh</span>
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/admin/cars/new"
                  className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-colors group"
                >
                  <Car className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-semibold text-white">Thêm mẫu Ô tô mới</p>
                  <p className="text-xs text-slate-400 mt-0.5">Cập nhật giá, pin & ảnh</p>
                </Link>

                <Link
                  href="/admin/banners/new"
                  className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-colors group"
                >
                  <Images className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-semibold text-white">Thêm Banner Slider</p>
                  <p className="text-xs text-slate-400 mt-0.5">Đổi banner trang chủ</p>
                </Link>

                <Link
                  href="/admin/motorbikes/new"
                  className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-colors group"
                >
                  <Bike className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-semibold text-white">Thêm Xe máy điện</p>
                  <p className="text-xs text-slate-400 mt-0.5">Khai trương dòng xe mới</p>
                </Link>

                <a
                  href={process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:3000'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-left transition-colors group"
                >
                  <ExternalLink className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-semibold text-white">Xem Landing Page</p>
                  <p className="text-xs text-slate-400 mt-0.5">Kiểm tra hiển thị thực tế</p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
