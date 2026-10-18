"use client";

/**
 * Task 18-d — Lonceng notifikasi CMS (header admin).
 * Polling GET /api/stats tiap 60 detik + saat window focus (pola aman
 * set-state-in-effect: setState hanya sebagai callback promise, spt AdminDashboard).
 * Badge = pesan belum dibaca + pendaftaran menunggu + pengaduan baru.
 * Klik item memindahkan section via prop onSection (dioper admin-view: setSection).
 */

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminStats } from "@/lib/types";

export function AdminBell({ onSection }: { onSection: (id: string) => void }) {
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Pola set-state-in-effect aman (sama dgn AdminDashboard): setState hanya
  // dipanggil sebagai callback promise, bukan sinkron di body effect.
  useEffect(() => {
    const fetchStats = () =>
      apiGet<AdminStats>("/api/stats").then(setStats).catch(() => {
        // Lonceng hanya pelengkap — biarkan senyap bila gagal memuat.
      });

    void fetchStats();
    const t = setInterval(() => void fetchStats(), 60_000);
    const onFocus = () => void fetchStats();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const unread = stats?.unreadMessages ?? 0;
  const pending = stats?.pendingApplications ?? 0;
  const complaints = stats?.unreadComplaints ?? 0;
  const total = unread + pending + complaints;

  const items = [
    { id: "messages", icon: "inbox", label: `${unread} pesan belum dibaca`, count: unread },
    { id: "applications", icon: "user-plus", label: `${pending} pendaftaran menunggu`, count: pending },
    { id: "complaints", icon: "shield-alert", label: `${complaints} pengaduan baru`, count: complaints },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id="muhdin-admin-bell-trigger"
          variant="outline"
          size="icon"
          className="relative rounded-full h-9 w-9"
          aria-label="Notifikasi"
        >
          <Icon name={total > 0 ? "bell-ring" : "bell"} className="h-4 w-4" aria-hidden />
          {total > 0 && (
            <span
              className="absolute -top-1 -right-1 grid h-4.5 min-w-4.5 place-items-center rounded-full danger-solid px-1 text-[9px] font-extrabold leading-none"
              aria-hidden
            >
              {total > 99 ? "99+" : total}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Icon name="bell-ring" className="h-4 w-4 text-primary" aria-hidden />
          Notifikasi
          {total > 0 && (
            <span className="ml-auto rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-extrabold text-destructive">
              {total} baru
            </span>
          )}
        </DropdownMenuLabel>
        {total === 0 ? (
          <div className="px-3 py-6 text-center">
            <Icon name="check-circle-2" className="h-6 w-6 mx-auto text-primary/60" aria-hidden />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Tidak ada notifikasi baru — semua sudah ditangani.
            </p>
          </div>
        ) : (
          items.map((it) => (
            <DropdownMenuItem
              key={it.id}
              disabled={it.count === 0}
              onClick={() => onSection(it.id)}
              className="gap-2.5 cursor-pointer"
            >
              <Icon name={it.icon} className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="text-sm">{it.label}</span>
              {it.count === 0 && <span className="ml-auto text-[10px] text-muted-foreground">kosong</span>}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
