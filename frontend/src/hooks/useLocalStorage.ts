// src/hooks/useLocalStorage.ts
import { useEffect, useState } from "react";

export function storageGet<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (e) {
    console.error(`storageGet error (${key})`, e);
    return fallback;
  }
}

export function storageSet<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`storageSet error (${key})`, e);
  }
}

/**
 * (선택) React hook 버전도 함께 제공
 * - PC/태블릿/모바일 웹에서도 그대로 사용 가능
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() =>
    storageGet<T>(key, initialValue)
  );

  const setValue = (value: T | ((prev: T) => T)) => {
    const valueToStore =
      value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    storageSet<T>(key, valueToStore);
  };

  // 다른 탭/창에서 localStorage가 변경되는 경우 동기화 (웹 MVP에서 유용)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      setStoredValue(storageGet<T>(key, initialValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, initialValue]);

  return [storedValue, setValue];
}
