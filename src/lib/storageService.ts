/**
 * Service to manage interview report history in browser localStorage.
 * No external database dependencies.
 */

export interface StoredReport {
    id: string;
    candidateName: string;
    date: string;
    duration: string;
    overallScore: number;
    shortlist: boolean;
    recommendation: string;
    suitableRoles: string[];
    analysis: any;
    questions: any[];
    resumeText: string;
}

const STORAGE_KEY = "hamii_interview_dataset";

export const storageService = {
    saveReport: (report: Omit<StoredReport, "id" | "date">): StoredReport => {
        const history = storageService.getReports();
        const newReport: StoredReport = {
            ...report,
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
        };

        history.unshift(newReport); // Add to beginning
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        return newReport;
    },

    getReports: (): StoredReport[] => {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        try {
            return JSON.parse(data);
        } catch (err) {
            console.error("Failed to parse history:", err);
            return [];
        }
    },

    deleteReport: (id: string) => {
        const history = storageService.getReports().filter(r => r.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    },

    clearHistory: () => {
        localStorage.removeItem(STORAGE_KEY);
    },

    exportDataset: () => {
        const data = storageService.getReports();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `interview-dataset-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
