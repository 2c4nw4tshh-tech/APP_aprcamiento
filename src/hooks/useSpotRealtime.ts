"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAppStore } from "@/store";
import { RealtimeParkingSpot } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, { realtime: { params: { eventsPerSecond: 10 } } })
  : null;

export function useSpotRealtime() {
  const upsertParkingSpot = useAppStore((state) => state.upsertParkingSpot);
  const removeParkingSpot = useAppStore((state) => state.removeParkingSpot);

  useEffect(() => {
    if (!supabase) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Supabase Realtime está desactivado: configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      }
      return;
    }

    const channel = supabase
      .channel("parking-spots-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "parking_spots" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as Partial<RealtimeParkingSpot>;
            if (oldRow.id) removeParkingSpot(oldRow.id, oldRow.legacySpotId);
            return;
          }

          const row = payload.new as RealtimeParkingSpot;
          if (row?.id) upsertParkingSpot(row);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [upsertParkingSpot, removeParkingSpot]);
}