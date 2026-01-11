import { useLocalStorage } from './useLocalStorage';
import type { Report } from '../types';
import { dummyReports } from '../data/reports';

const STORAGE_KEY = 'climate-safety-hub-reports';

export function useReports() {
  const [reports, setReports] = useLocalStorage<Report[]>(STORAGE_KEY, dummyReports);

  const addReport = (report: Omit<Report, 'id' | 'createdAt' | 'status'>) => {
    const newReport: Report = {
      ...report,
      id: `report-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    setReports((prev) => [...prev, newReport]);
    return newReport;
  };

  const getReportById = (id: string) => {
    return reports.find((report) => report.id === id);
  };

  const getReportsByType = (type: Report['type']) => {
    return reports.filter((report) => report.type === type);
  };

  const getReportsByStatus = (status: Report['status']) => {
    return reports.filter((report) => report.status === status);
  };

  return {
    reports,
    addReport,
    getReportById,
    getReportsByType,
    getReportsByStatus,
  };
}
