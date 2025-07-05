"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Template, Response } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navigation } from "@/components/Navigation";
import { toast } from "sonner";
import { exportApi, templateApi } from "@/lib/api";
import {
  ArrowLeft,
  Download,
  FileText,
  Search,
  Filter,
  Eye,
  Calendar,
  Users,
  BarChart3,
  Share2,
  Link as LinkIcon,
  Copy,
} from "lucide-react";

interface TemplateResponsesPageProps {
  params: {
    id: string;
  };
}

export default function TemplateResponsesPage({
  params,
}: TemplateResponsesPageProps) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResponses, setTotalResponses] = useState(0);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, [params.id, currentPage, statusFilter, searchTerm]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await exportApi.getTemplateResponses(params.id, {
        page: currentPage,
        limit: 10,
        status: statusFilter,
        search: searchTerm,
      });

      setTemplate(data.template);
      setResponses(data.responses);
      setTotalPages(data.pagination.pages);
      setTotalResponses(data.pagination.total);
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Failed to load template responses"
      );
      toast.error("Failed to load template responses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: "csv" | "excel") => {
    try {
      let blob;
      if (format === "csv") {
        blob = await exportApi.exportTemplateCsv(params.id, {
          status: statusFilter,
        });
      } else {
        blob = await exportApi.exportTemplateExcel(params.id, {
          status: statusFilter,
        });
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${template?.name?.replace(/\s+/g, "_")}_responses.${
          format === "csv" ? "csv" : "xlsx"
        }`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Responses exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export responses as ${format.toUpperCase()}`);
    }
  };

  const handleGenerateShareLink = async () => {
    try {
      const response = await templateApi.generateShareLink(params.id, {
        allowAnonymous: true,
      });
      setShareUrl(response.shareUrl);
      setShowShareDialog(true);
      toast.success("Share link generated successfully");
    } catch (error) {
      toast.error("Failed to generate share link");
    }
  };

  const handleCopyShareLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "secondary";
      case "submitted":
        return "default";
      case "reviewed":
        return "outline";
      case "approved":
        return "success";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">Template Responses</h1>
                  <p className="text-muted-foreground">
                    {template?.name} - {totalResponses} responses
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateShareLink}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Form
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("csv")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("excel")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>

            {/* Share Dialog */}
            {showShareDialog && shareUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <LinkIcon className="h-5 w-5" />
                    <span>Public Form Link</span>
                  </CardTitle>
                  <CardDescription>
                    Share this link to allow anyone to fill out the form
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Input value={shareUrl} readOnly className="flex-1" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyShareLink}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowShareDialog(false)}
                    >
                      Close
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Responses
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalResponses}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Submitted
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {responses.filter((r) => r.status === "submitted").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Approved
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {responses.filter((r) => r.status === "approved").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg. Completion
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {responses.length > 0
                      ? Math.round(
                          responses.reduce(
                            (sum, r) => sum + r.completionPercentage,
                            0
                          ) / responses.length
                        )
                      : 0}
                    %
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search by name, email, or company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-48">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={statusFilter || "all"}
                      onValueChange={(value) =>
                        setStatusFilter(value === "all" ? "" : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Responses Table */}
            <Card>
              <CardHeader>
                <CardTitle>Responses</CardTitle>
                <CardDescription>
                  All responses for this template
                </CardDescription>
              </CardHeader>
              <CardContent>
                {responses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No responses found for this template
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Submitter</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {responses.map((response) => (
                          <TableRow key={response._id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {typeof response.userId === "object" &&
                                  response.userId
                                    ? `${response.userId.firstName} ${response.userId.lastName}`
                                    : response.submitterInfo?.name ||
                                      "Anonymous"}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {typeof response.userId === "object" &&
                                  response.userId
                                    ? response.userId.email
                                    : response.submitterInfo?.email ||
                                      "No email"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(response.status)}>
                                {response.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Progress
                                  value={response.completionPercentage}
                                  className="w-16"
                                />
                                <span className="text-sm">
                                  {response.completionPercentage}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {response.submittedAt
                                ? formatDate(response.submittedAt.toString())
                                : "Not submitted"}
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/responses/${response._id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Showing{" "}
                        {Math.min((currentPage - 1) * 10 + 1, totalResponses)}{" "}
                        to {Math.min(currentPage * 10, totalResponses)} of{" "}
                        {totalResponses} responses
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
                              const pageNum = i + 1;
                              return (
                                <Button
                                  key={pageNum}
                                  variant={
                                    currentPage === pageNum
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => setCurrentPage(pageNum)}
                                >
                                  {pageNum}
                                </Button>
                              );
                            }
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
