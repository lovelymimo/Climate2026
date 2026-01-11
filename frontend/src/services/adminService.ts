import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

// 제보 타입
export interface AdminReport {
  id: string;
  userId: string;
  type: "flood" | "drain" | "etc";
  address: string;
  addressDetail: string;
  coordinates: string;
  description: string;
  contact: string;
  status: "pending" | "reviewing" | "completed" | "rejected";
  points: number;
  createdAt: Date;
  reviewNote?: string;
}

// 회원 타입
export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  userType: "citizen" | "business" | null;
  points: number;
  level: "bronze" | "silver" | "gold";
  reportCount: number;
  createdAt: Date;
}

// 통계 타입
export interface AdminStats {
  totalUsers: number;
  totalReports: number;
  pendingReports: number;
  totalPoints: number;
  todayReports: number;
  todayUsers: number;
}

// 모든 제보 조회
export async function fetchAllReports(): Promise<AdminReport[]> {
  try {
    const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
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
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(data.createdAt),
        reviewNote: data.reviewNote,
      };
    });
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return [];
  }
}

// 모든 회원 조회
export async function fetchAllUsers(): Promise<AdminUser[]> {
  try {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email,
        displayName: data.displayName,
        userType: data.userType,
        points: data.points || 0,
        level: calculateLevel(data.points || 0),
        reportCount: data.reportCount || 0,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(data.createdAt),
      };
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return [];
  }
}

// 제보 상태 변경
export async function updateReportStatus(
  reportId: string,
  status: "pending" | "reviewing" | "completed" | "rejected",
  reviewNote?: string
): Promise<boolean> {
  try {
    const reportRef = doc(db, "reports", reportId);
    await updateDoc(reportRef, {
      status,
      ...(reviewNote && { reviewNote }),
    });
    return true;
  } catch (error) {
    console.error("Failed to update report status:", error);
    return false;
  }
}

// 통계 조회
export async function fetchAdminStats(): Promise<AdminStats> {
  try {
    const [users, reports] = await Promise.all([
      fetchAllUsers(),
      fetchAllReports(),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayUsers = users.filter((u) => u.createdAt >= today).length;
    const todayReports = reports.filter((r) => r.createdAt >= today).length;
    const pendingReports = reports.filter((r) => r.status === "pending").length;
    const totalPoints = users.reduce((sum, u) => sum + u.points, 0);

    return {
      totalUsers: users.length,
      totalReports: reports.length,
      pendingReports,
      totalPoints,
      todayReports,
      todayUsers,
    };
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return {
      totalUsers: 0,
      totalReports: 0,
      pendingReports: 0,
      totalPoints: 0,
      todayReports: 0,
      todayUsers: 0,
    };
  }
}

// 등급 계산
function calculateLevel(points: number): "bronze" | "silver" | "gold" {
  if (points >= 500) return "gold";
  if (points >= 200) return "silver";
  return "bronze";
}
