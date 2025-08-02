import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import DocumentUpload from "./DocumentUpload";
import {
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  MoreVertical,
  Calendar,
  BarChart3,
} from "lucide-react";
import { projectId } from "../utils/supabase/info";

interface Document {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  analysis_status:
    | "pending"
    | "extracting"
    | "classifying"
    | "analyzing"
    | "complete"
    | "error";
  analysis_progress: number;
}

interface DashboardProps {
  accessToken: string;
  onDocumentSelect: (documentId: string) => void;
}

export default function Dashboard({
  accessToken,
  onDocumentSelect,
}: DashboardProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchDocuments();
    fetchProfile();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0cfdab42/documents`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0cfdab42/profile`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(2)) +
      " " +
      sizes[i]
    );
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "extracting":
      case "classifying":
      case "analyzing":
        return "bg-blue-100 text-blue-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "complete":
        return "Complete";
      case "pending":
        return "Pending";
      case "extracting":
        return "Extracting";
      case "classifying":
        return "Classifying";
      case "analyzing":
        return "Analyzing";
      case "error":
        return "Error";
      default:
        return status;
    }
  };

  const completedDocuments = documents.filter(
    (doc) => doc.analysis_status === "complete",
  );
  const processingDocuments = documents.filter((doc) =>
    [
      "pending",
      "extracting",
      "classifying",
      "analyzing",
    ].includes(doc.analysis_status),
  );

  if (showUpload) {
    return (
      <DocumentUpload
        accessToken={accessToken}
        onUploadComplete={() => {
          setShowUpload(false);
          fetchDocuments();
        }}
        onCancel={() => setShowUpload(false)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {profile?.name || "User"}. Here's your
            legal document analysis overview.
          </p>
        </div>
        <Button
          onClick={() => setShowUpload(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              +
              {
                documents.filter((doc) => {
                  const uploadDate = new Date(doc.uploaded_at);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return uploadDate > weekAgo;
                }).length
              }{" "}
              this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed Analyses
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedDocuments.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(
                (completedDocuments.length /
                  Math.max(documents.length, 1)) *
                  100,
              )}
              % completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Processing
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {processingDocuments.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Currently being analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Subscription
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {profile?.subscription_tier || "Free"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Current plan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">
                Loading documents...
              </p>
            </div>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No documents yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Upload your first legal document to get
                  started with AI-powered analysis.
                </p>
                <Button
                  onClick={() => setShowUpload(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <Card
                  key={doc.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <h3 className="font-medium text-gray-900 truncate">
                            {doc.name}
                          </h3>
                          <Badge
                            variant="secondary"
                            className={getStatusColor(
                              doc.analysis_status,
                            )}
                          >
                            {getStatusText(doc.analysis_status)}
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span>
                            {formatFileSize(doc.file_size)}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(doc.uploaded_at)}
                          </span>
                        </div>

                        {doc.analysis_status !== "complete" &&
                          doc.analysis_status !== "error" && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  Analysis Progress
                                </span>
                                <span className="text-gray-900">
                                  {doc.analysis_progress}%
                                </span>
                              </div>
                              <Progress
                                value={doc.analysis_progress}
                                className="h-2"
                              />
                            </div>
                          )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {doc.analysis_status === "complete" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onDocumentSelect(doc.id)
                            }
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Analysis
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                  Analysis Overview
                </CardTitle>
                <CardDescription>
                  Document analysis statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Average Risk Score
                    </span>
                    <span className="text-lg font-semibold text-orange-600">
                      4.2/10
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Most Common Issue
                    </span>
                    <span className="text-sm font-medium">
                      Liability Clauses
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Compliance Score
                    </span>
                    <span className="text-lg font-semibold text-green-600">
                      78%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                  Common Risks Found
                </CardTitle>
                <CardDescription>
                  Frequent issues in your documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      Broad liability limitations
                    </span>
                    <Badge
                      variant="outline"
                      className="text-red-600 border-red-200"
                    >
                      High Risk
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      Missing termination clauses
                    </span>
                    <Badge
                      variant="outline"
                      className="text-yellow-600 border-yellow-200"
                    >
                      Medium Risk
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      Vague IP ownership terms
                    </span>
                    <Badge
                      variant="outline"
                      className="text-yellow-600 border-yellow-200"
                    >
                      Medium Risk
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>
                AI-powered suggestions to improve your legal
                documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">
                      1
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Add Force Majeure Clauses
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      60% of your contracts are missing force
                      majeure provisions. Consider adding these
                      to protect against unforeseen
                      circumstances.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-green-600">
                      2
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Standardize Confidentiality Terms
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Your confidentiality clauses vary
                      significantly. Create a standard template
                      to ensure consistent protection.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-purple-600">
                      3
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Review Liability Caps
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Consider implementing mutual liability
                      caps to balance risk allocation between
                      parties.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}