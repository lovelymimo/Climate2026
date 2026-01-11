/* eslint-disable react-refresh/only-export-components */

// src/store/AppStore.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { storageGet, storageSet } from "../hooks/useLocalStorage";

/* =====================
   Types (MVP)
===================== */
export type Region = {
  sido: string;
  sigungu: string;
  eupmyeondong?: string;
};

export type Report = {
  id: string;
  region: Region;
  locationText: string;
  description: string;
  createdAt: string;
  points: number;
};

export type Reward = {
  id: string;
  title: string;
  cost: number;
};

export type AppState = {
  region: Region;
  reports: Report[];
  points: number;
  rewards: Reward[];
};

/* =====================
   Constants
===================== */
const STORAGE_KEY = "climate-safety-hub-mvp";

/* =====================
   Utils
===================== */
const uid = () => Math.random().toString(36).slice(2, 9);
const now = () => new Date().toISOString();

/* =====================
   Initial State
===================== */
const initialState: AppState = {
  region: { sido: "경기도", sigungu: "수원시" },
  reports: [],
  points: 0,
  rewards: [
    { id: "gs25", title: "GS25 모바일 교환권", cost: 800 },
    { id: "cafe", title: "동네 카페 할인", cost: 1500 },
  ],
};

/* =====================
   Reducer
===================== */
type Action =
  | { type: "LOAD"; state: AppState }
  | { type: "SET_REGION"; region: Region }
  | { type: "ADD_REPORT"; payload: { locationText: string; description: string } }
  | { type: "USE_REWARD"; rewardId: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "LOAD":
      return action.state;

    case "SET_REGION":
      return { ...state, region: action.region };

    case "ADD_REPORT": {
      const earned = 10;
      return {
        ...state,
        reports: [
          {
            id: uid(),
            region: state.region,
            locationText: action.payload.locationText,
            description: action.payload.description,
            createdAt: now(),
            points: earned,
          },
          ...state.reports,
        ],
        points: state.points + earned,
      };
    }

    case "USE_REWARD": {
      const reward = state.rewards.find((r) => r.id === action.rewardId);
      if (!reward || state.points < reward.cost) return state;
      return { ...state, points: state.points - reward.cost };
    }

    default:
      return state;
  }
}

/* =====================
   Context
===================== */
export type AppStoreContextValue = {
  state: AppState;
  setRegion: (region: Region) => void;
  addReport: (locationText: string, description: string) => void;
  useReward: (rewardId: string) => void;
};

// ✅ null 대신 undefined로 두면, 아래 훅에서 타입이 완전히 좁혀져서 빨간줄이 없어짐
const AppStoreContext = createContext<AppStoreContextValue | undefined>(
  undefined
);

/* =====================
   Provider
===================== */
export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // load from localStorage (처음 1번)
  useEffect(() => {
    const saved = storageGet<AppState | null>(STORAGE_KEY, null);
    if (saved) dispatch({ type: "LOAD", state: saved });
  }, []);

  // save to localStorage (state 변경 때마다)
  useEffect(() => {
    storageSet(STORAGE_KEY, state);
  }, [state]);

  const value = useMemo<AppStoreContextValue>(
    () => ({
      state,
      setRegion: (region) => dispatch({ type: "SET_REGION", region }),
      addReport: (locationText, description) =>
        dispatch({
          type: "ADD_REPORT",
          payload: { locationText, description },
        }),
      useReward: (rewardId) => dispatch({ type: "USE_REWARD", rewardId }),
    }),
    [state]
  );

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
}

/* =====================
   Hook
===================== */
export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (ctx === undefined) {
    throw new Error("useAppStore must be used within <AppStoreProvider>");
  }
  return ctx;
}
