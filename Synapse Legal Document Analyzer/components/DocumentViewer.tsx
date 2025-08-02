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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import AILegalAssistant from "./AILegalAssistant";
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Share,
  MessageSquare,
  Eye,
  BarChart3,
  Shield,
  AlertCircle,
  Info,
  Lightbulb,
  ExternalLink,
} from "lucide-react";
import { projectId } from "../utils/supabase/info";

interface Clause {
  id: string;
  type: string;
  text: string;
  risk_score: number;
  explanation: string;
  suggestions: string[];
}

interface Analysis {
  document_id: string;
  clauses: Clause[];
  summary: string;
  overall_risk_score: number;
  missing_clauses: string[];
  compliance_score: number;
  analyzed_at: string;
}

interface Document {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  analysis_status: string;
}

interface DocumentViewerProps {
  documentId: string;
  accessToken: string;
  onBack: () => void;
}

export default function DocumentViewer({
  documentId,
  accessToken,
  onBack,
}: DocumentViewerProps) {
  const [document, setDocument] = useState<Document | null>(
    null,
  );
  const [analysis, setAnalysis] = useState<Analysis | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [selectedClause, setSelectedClause] = useState<
    string | null
  >(null);
  const [showAssistant, setShowAssistant] = useState(false);

  useEffect(() => {
    fetchDocumentAndAnalysis();
  }, [documentId]);

  const fetchDocumentAndAnalysis = async () => {
    try {
      const [docResponse, analysisResponse] = await Promise.all(
        [
          fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-0cfdab42/documents`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          ),
          fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-0cfdab42/documents/${documentId}/analysis`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          ),
        ],
      );

      if (docResponse.ok) {
        const docData = await docResponse.json();
        const doc = docData.documents.find(
          (d: Document) => d.id === documentId,
        );
        setDocument(doc);
      }

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        setAnalysis(analysisData.analysis);
      }
    } catch (error) {
      console.error(
        "Failed to fetch document analysis:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 8) return "text-red-600 bg-red-100";
    if (score >= 6) return "text-orange-600 bg-orange-100";
    if (score >= 4) return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
  };

  const getRiskLevel = (score: number) => {
    if (score >= 8) return "High Risk";
    if (score >= 6) return "Medium-High Risk";
    if (score >= 4) return "Medium Risk";
    return "Low Risk";
  };

  const getClauseTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      liability: "bg-red-100 text-red-800",
      termination: "bg-orange-100 text-orange-800",
      confidentiality: "bg-blue-100 text-blue-800",
      payment: "bg-green-100 text-green-800",
      intellectual_property: "bg-purple-100 text-purple-800",
      indemnification: "bg-pink-100 text-pink-800",
      default: "bg-gray-100 text-gray-800",
    };
    return colors[type] || colors.default;
  };

  const formatClauseType = (type: string) => {
    return type
      .split("_")
      .map(
        (word) => word.charAt(0).toUpperCase() + word.slice(1),
      )
      .join(" ");
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            Loading document analysis...
          </p>
        </div>
      </div>
    );
  }

  if (!document || !analysis) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Analysis not available
            </h3>
            <p className="text-gray-600">
              The document analysis is still in progress or
              failed to complete.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {document.name}
            </h1>
            <p className="text-gray-600">
              Analysis completed on{" "}
              {new Date(
                analysis.analyzed_at,
              ).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowAssistant(!showAssistant)}
            className={
              showAssistant ? "bg-blue-50 border-blue-200" : ""
            }
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Overall Risk Score
                </CardTitle>
                <Shield className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysis.overall_risk_score}/10
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {getRiskLevel(analysis.overall_risk_score)}
                </p>
                <Progress
                  value={analysis.overall_risk_score * 10}
                  className="mt-3 h-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Compliance Score
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysis.compliance_score}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Industry standard compliance
                </p>
                <Progress
                  value={analysis.compliance_score}
                  className="mt-3 h-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Clauses Analyzed
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysis.clauses.length}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {analysis.missing_clauses.length} missing
                  clauses detected
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Document Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Document Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {analysis.summary}
              </p>
            </CardContent>
          </Card>

          {/* Main Analysis Tabs */}
          <Tabs defaultValue="clauses" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="clauses">
                Clause Analysis
              </TabsTrigger>
              <TabsTrigger value="missing">
                Missing Clauses
              </TabsTrigger>
              <TabsTrigger value="recommendations">
                Recommendations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clauses" className="space-y-4">
              {analysis.clauses.map((clause) => (
                <Card
                  key={clause.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedClause === clause.id
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedClause(
                      selectedClause === clause.id
                        ? null
                        : clause.id,
                    )
                  }
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge
                          className={getClauseTypeColor(
                            clause.type,
                          )}
                        >
                          {formatClauseType(clause.type)}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            Risk Score:
                          </span>
                          <Badge
                            className={getRiskColor(
                              clause.risk_score,
                            )}
                          >
                            {clause.risk_score}/10
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClause(clause.id);
                          setShowAssistant(true);
                        }}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 italic">
                          "{clause.text}"
                        </p>
                      </div>

                      {selectedClause === clause.id && (
                        <div className="space-y-4 pt-4 border-t">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                              <Info className="w-4 h-4 mr-2 text-blue-600" />
                              Analysis
                            </h4>
                            <p className="text-sm text-gray-600">
                              {clause.explanation}
                            </p>
                          </div>

                          {clause.suggestions.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                <Lightbulb className="w-4 h-4 mr-2 text-yellow-600" />
                                Suggestions
                              </h4>
                              <ul className="space-y-1">
                                {clause.suggestions.map(
                                  (suggestion, index) => (
                                    <li
                                      key={index}
                                      className="text-sm text-gray-600 flex items-start"
                                    >
                                      <span className="text-blue-600 mr-2">
                                        •
                                      </span>
                                      {suggestion}
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="missing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-600">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Missing Clauses Detected
                  </CardTitle>
                  <CardDescription>
                    These common clauses were not found in your
                    document and may require attention.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.missing_clauses.map(
                      (clause, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-orange-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                              <AlertTriangle className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {clause}
                              </p>
                              <p className="text-sm text-gray-600">
                                This clause is commonly included
                                in similar contracts
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Learn More
                          </Button>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="recommendations"
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">
                      Immediate Actions
                    </CardTitle>
                    <CardDescription>
                      High-priority recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-red-600">
                            1
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Review Liability Clause
                          </p>
                          <p className="text-sm text-gray-600">
                            The current limitation may be too
                            broad
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-orange-600">
                            2
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Add Force Majeure
                          </p>
                          <p className="text-sm text-gray-600">
                            Missing protection against
                            unforeseen events
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-blue-600">
                      Future Improvements
                    </CardTitle>
                    <CardDescription>
                      Long-term enhancements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-blue-600">
                            1
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Standardize Templates
                          </p>
                          <p className="text-sm text-gray-600">
                            Create consistent clause library
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-purple-600">
                            2
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Regular Reviews
                          </p>
                          <p className="text-sm text-gray-600">
                            Schedule periodic contract audits
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* AI Assistant Sidebar */}
        {showAssistant && (
          <div className="lg:col-span-1">
            <AILegalAssistant
              accessToken={accessToken}
              documentId={documentId}
              selectedClause={selectedClause}
              onClose={() => setShowAssistant(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}