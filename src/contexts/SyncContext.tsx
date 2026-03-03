"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSync } from "@/hooks/useSync";

interface SyncContextType {
  isSyncing: boolean;
  needsSync: boolean;
  triggerSync: () => Promise<void>;
  hasLocalData: boolean;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const userId = session?.user?.email;
  const [isSyncing, setIsSyncing] = useState(false);
  const [needsSync, setNeedsSync] = useState(false);
  const [hasLocalData, setHasLocalData] = useState(false);
  const sync = useSync();

  // Check if user has local data
  useEffect(() => {
    if (userId) {
      setHasLocalData(sync.hasLocalData());
    }
  }, [userId, sync]);

  // Check if sync is needed (user logged in but no data in DB yet)
  useEffect(() => {
    if (status === "authenticated" && userId) {
      // This will be set by the component that checks DB state
      checkSyncNeeded();
    }
  }, [status, userId]);

  const checkSyncNeeded = async () => {
    // This will be called from components that know the DB state
    // We'll implement this in the CharacterSelector
  };

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      // This will be implemented with actual API calls
      setNeedsSync(false);
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SyncContext.Provider value={{ isSyncing, needsSync, triggerSync, hasLocalData }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncContext() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSyncContext must be used within SyncProvider");
  }
  return context;
}
