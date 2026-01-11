import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import type { User } from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";

// 사용자 프로필 타입
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  userType: "citizen" | "business" | null; // 시민 / 기업
  points: number;
  level: "bronze" | "silver" | "gold";
  reportCount: number;
  createdAt: Date;
}

// 제보 기록 타입
export interface ReportRecord {
  id: string;
  userId: string;
  type: "flood" | "drain" | "etc";
  address: string;
  addressDetail: string;
  coordinates: string;
  description: string;
  contact: string;
  status: "pending" | "reviewing" | "completed";
  points: number;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  reports: ReportRecord[];
  loading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserType: (userType: "citizen" | "business") => Promise<void>;
  addReport: (report: Omit<ReportRecord, "id" | "userId" | "status" | "points" | "createdAt">) => Promise<void>;
  refreshReports: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// 포인트에 따른 등급 계산
function calculateLevel(points: number): "bronze" | "silver" | "gold" {
  if (points >= 500) return "gold";
  if (points >= 200) return "silver";
  return "bronze";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // 사용자 프로필 로드
  const loadProfile = async (uid: string) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({
          uid,
          email: data.email,
          displayName: data.displayName,
          userType: data.userType,
          points: data.points || 0,
          level: calculateLevel(data.points || 0),
          reportCount: data.reportCount || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      } else {
        // Firestore에 프로필이 없으면 Firebase Auth 정보로 기본 프로필 생성
        const currentUser = auth.currentUser;
        if (currentUser) {
          setProfile({
            uid: currentUser.uid,
            email: currentUser.email || "",
            displayName: currentUser.displayName || "사용자",
            userType: null,
            points: 0,
            level: "bronze",
            reportCount: 0,
            createdAt: new Date(),
          });
        } else {
          setProfile(null);
        }
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      // Firestore 오류 시 Firebase Auth 정보로 기본 프로필 설정
      const currentUser = auth.currentUser;
      if (currentUser) {
        setProfile({
          uid: currentUser.uid,
          email: currentUser.email || "",
          displayName: currentUser.displayName || "사용자",
          userType: null,
          points: 0,
          level: "bronze",
          reportCount: 0,
          createdAt: new Date(),
        });
      } else {
        setProfile(null);
      }
    }
  };

  // 제보 기록 로드
  const loadReports = async (uid: string) => {
    try {
      // 복합 인덱스 없이 단순 쿼리 사용 (클라이언트 측 정렬)
      const q = query(
        collection(db, "reports"),
        where("userId", "==", uid)
      );
      const querySnapshot = await getDocs(q);
      const reportList: ReportRecord[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reportList.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          address: data.address,
          addressDetail: data.addressDetail,
          coordinates: data.coordinates,
          description: data.description,
          contact: data.contact,
          status: data.status,
          points: data.points,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      // 클라이언트 측에서 최신순 정렬
      reportList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setReports(reportList);
    } catch (error) {
      console.error("Failed to load reports:", error);
      setReports([]);
    }
  };

  // 타임아웃 헬퍼 함수
  const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    );
    return Promise.race([promise, timeout]);
  };

  // Auth 상태 변화 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);

        if (user) {
          // 3초 타임아웃으로 Firestore 로드 (실패해도 기본 프로필 사용)
          try {
            await withTimeout(loadProfile(user.uid), 3000);
          } catch {
            console.warn("Profile load timeout, using default");
            setProfile({
              uid: user.uid,
              email: user.email || "",
              displayName: user.displayName || "사용자",
              userType: null,
              points: 0,
              level: "bronze",
              reportCount: 0,
              createdAt: new Date(),
            });
          }

          try {
            await withTimeout(loadReports(user.uid), 3000);
          } catch {
            console.warn("Reports load timeout");
            setReports([]);
          }
        } else {
          setProfile(null);
          setReports([]);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // 회원가입
  const signup = async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 프로필 업데이트
    await updateProfile(user, { displayName });

    // Firestore에 사용자 문서 생성
    await setDoc(doc(db, "users", user.uid), {
      email,
      displayName,
      userType: null,
      points: 0,
      reportCount: 0,
      createdAt: serverTimestamp(),
    });

    await loadProfile(user.uid);
  };

  // 로그인
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Google 로그인
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    try {
      // Firestore에 사용자 문서가 없으면 생성
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          email: user.email,
          displayName: user.displayName || "사용자",
          userType: null,
          points: 0,
          reportCount: 0,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Firestore error during Google login:", error);
      // Firestore 오류 시에도 Firebase Auth 정보로 기본 프로필 설정
      setProfile({
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "사용자",
        userType: null,
        points: 0,
        level: "bronze",
        reportCount: 0,
        createdAt: new Date(),
      });
    }

    await loadProfile(user.uid);
    await loadReports(user.uid);
  };

  // 로그아웃
  const logout = async () => {
    await signOut(auth);
  };

  // 사용자 유형 업데이트
  const updateUserType = async (userType: "citizen" | "business") => {
    if (!user) return;

    const docRef = doc(db, "users", user.uid);
    await updateDoc(docRef, { userType });

    if (profile) {
      setProfile({ ...profile, userType });
    }
  };

  // 제보 추가
  const addReport = async (
    report: Omit<ReportRecord, "id" | "userId" | "status" | "points" | "createdAt">
  ) => {
    if (!user || !profile) return;

    const points = 10; // 기본 포인트

    try {
      // 3초 타임아웃으로 Firestore 저장 시도
      await withTimeout(
        addDoc(collection(db, "reports"), {
          ...report,
          userId: user.uid,
          status: "pending",
          points,
          createdAt: serverTimestamp(),
        }),
        3000
      );

      // 사용자 포인트 및 제보 수 업데이트
      const newPoints = profile.points + points;
      const newReportCount = profile.reportCount + 1;

      const userRef = doc(db, "users", user.uid);
      await withTimeout(
        updateDoc(userRef, {
          points: newPoints,
          reportCount: newReportCount,
        }),
        3000
      );

      // 로컬 상태 업데이트
      setProfile({
        ...profile,
        points: newPoints,
        reportCount: newReportCount,
        level: calculateLevel(newPoints),
      });

      await withTimeout(loadReports(user.uid), 3000);
    } catch (error) {
      console.error("Failed to save report to Firestore:", error);
      // Firestore 저장 실패해도 로컬 상태는 업데이트
      const newPoints = profile.points + points;
      const newReportCount = profile.reportCount + 1;
      setProfile({
        ...profile,
        points: newPoints,
        reportCount: newReportCount,
        level: calculateLevel(newPoints),
      });
    }
  };

  // 제보 목록 새로고침
  const refreshReports = async () => {
    if (user) {
      await loadReports(user.uid);
    }
  };

  const value = {
    user,
    profile,
    reports,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    updateUserType,
    addReport,
    refreshReports,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
