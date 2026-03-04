import { useState, useEffect } from "react";
import { storageService, StoredReport } from "@/lib/storageService";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Download,
    Trash2,
    Eye,
    User,
    Calendar,
    Trophy,
    CheckCircle2,
    XCircle,
    Database,
    ArrowLeft
} from "lucide-react";
import { downloadReportPdf } from "@/lib/generateReportPdf";
import { Cloud, Loader2 } from "lucide-react";

interface HistoryViewProps {
    onBack: () => void;
    onViewReport: (report: StoredReport) => void;
}

export const HistoryView = ({ onBack, onViewReport }: HistoryViewProps) => {
    const [reports, setReports] = useState<StoredReport[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await storageService.getReports();
            setReports(data || []);
        } catch (err) {
            console.error("Fetch failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete the report for ${name}?`)) {
            await storageService.deleteReport(id);
            fetchReports();
        }
    };

    const handleExport = () => {
        storageService.exportDataset();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Syncing with global dataset...</p>
            </div>
        );
    }

    if (reports.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Interview
                    </Button>
                    <h1 className="text-3xl font-bold">Interview Dataset</h1>
                </div>
                <div className="rounded-xl border border-dashed border-border bg-card p-20 text-center">
                    <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-medium mb-2">No data yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        Complete your first interview to start building your dataset of candidate reports.
                    </p>
                    <Button onClick={onBack} className="mt-6">Start Interview</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Interview Dataset</h1>
                        <p className="text-sm text-muted-foreground">Historical records of all mock interviews</p>
                    </div>
                </div>
                <Button variant="outline" onClick={handleExport} className="gap-2 self-start sm:self-auto">
                    <Download className="h-4 w-4" /> Export Dataset (JSON)
                </Button>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-[200px]">Candidate</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-center">Score</TableHead>
                            <TableHead>Verdict</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.map((report) => (
                            <TableRow key={report.id} className="group cursor-pointer hover:bg-muted/30">
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <span>{report.candidateName || "Anonymous"}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(report.date).toLocaleDateString()}
                                        <Cloud className="h-3 w-4 text-primary/40 ml-1" title="Stored in Global Database" />
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-secondary text-sm font-bold border border-border">
                                        {Math.round(report.overallScore)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {report.shortlist ? (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                                                <CheckCircle2 className="h-3 w-3" /> Shortlisted
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                                                <XCircle className="h-3 w-3" /> Rejected
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" onClick={() => onViewReport(report)} title="View in UI">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => downloadReportPdf(report.analysis, report.questions, report.resumeText)} title="Download PDF">
                                            <Download className="h-4 w-4 text-primary" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(report.id, report.candidateName)} title="Delete">
                                            <Trash2 className="h-4 w-4 text-red-400" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 p-4 rounded-lg">
                <Database className="h-4 w-4" />
                <span>Data is stored locally in your browser. Clearing your browser cache may remove these records. Use the Export button to backup your data.</span>
            </div>
        </div>
    );
};
