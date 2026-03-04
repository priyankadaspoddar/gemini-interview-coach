/**
 * Service to manage interview report history in Supabase.
 * Fallback to localStorage if Supabase is not configured or fails.
 */
import { supabase } from "@/integrations/supabase/client";

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

const LOCAL_STORAGE_KEY = "hamii_interview_dataset";

export const storageService = {
    saveReport: async (report: Omit<StoredReport, "id" | "date">): Promise<StoredReport | null> => {
        // 1. Always save to LocalStorage as a backup/instant view
        const localHistory = storageService.getLocalReports();
        const newReportLocal: StoredReport = {
            ...report,
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
        };
        localHistory.unshift(newReportLocal);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localHistory));

        // 2. Sync to Supabase Global Dataset
        try {
            const { data, error } = await supabase
                .from("reports" as any)
                .insert({
                    candidate_name: report.candidateName,
                    duration: report.duration,
                    overall_score: report.overallScore,
                    shortlist: report.shortlist,
                    recommendation: report.recommendation,
                    suitable_roles: report.suitableRoles,
                    analysis_data: report.analysis,
                    questions_data: report.questions,
                    resume_text: report.resumeText
                } as any)
                .select()
                .single();

            if (error) {
                console.warn("Supabase save failed, data is safe only in local storage:", error);
                return newReportLocal;
            }

            return {
                ...newReportLocal,
                id: data.id // Use the real DB ID if available
            };
        } catch (err) {
            console.error("Global sync failed:", err);
            return newReportLocal;
        }
    },

    getReports: async (): Promise<StoredReport[]> => {
        try {
            // Primary: Fetch from Supabase for Global Dataset
            const { data, error } = await supabase
                .from("reports" as any)
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            return data.map((r: any) => ({
                id: r.id,
                candidateName: r.candidate_name,
                date: r.created_at || r.date,
                duration: r.duration,
                overallScore: r.overall_score,
                shortlist: r.shortlist,
                recommendation: r.recommendation,
                suitableRoles: r.suitable_roles || [],
                analysis: r.analysis_data,
                questions: r.questions_data,
                resumeText: r.resume_text
            }));
        } catch (err) {
            console.warn("Could not fetch global dataset, falling back to local storage:", err);
            return storageService.getLocalReports();
        }
    },

    getLocalReports: (): StoredReport[] => {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!data) return [];
        try {
            return JSON.parse(data);
        } catch (err) {
            return [];
        }
    },

    deleteReport: async (id: string) => {
        // Delete from Local
        const localHistory = storageService.getLocalReports().filter(r => r.id !== id);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localHistory));

        // Delete from Supabase
        try {
            await supabase.from("reports" as any).delete().eq("id", id);
        } catch (err) {
            console.error("Failed to delete from global store:", err);
        }
    },

    clearHistory: () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    },

    exportDataset: async () => {
        const data = await storageService.getReports();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `interview-global-dataset-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
