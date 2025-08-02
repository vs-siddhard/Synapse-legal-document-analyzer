import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  projectId,
  publicAnonKey,
} from "./utils/supabase/info";
import LoginForm from "./components/auth/LoginForm";
import SignupForm from "./components/auth/SignupForm";
import Dashboard from "./components/Dashboard";
import DocumentViewer from "./components/DocumentViewer";
import UserProfile from "./components/UserProfile";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import {
  FileText,
  Shield,
  Zap,
  Users,
  LogOut,
} from "lucide-react";

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
);

type User = {
  id: string;
  email: string;
  user_metadata: {
    name: string;
  };
};

type AppView = "dashboard" | "document" | "profile";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "signup">(
    "login",
  );
  const [currentView, setCurrentView] =
    useState<AppView>("dashboard");
  const [selectedDocumentId, setSelectedDocumentId] = useState<
    string | null
  >(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user && session?.access_token) {
        setUser(session.user as User);
        setAccessToken(session.access_token);
      }
    } catch (error) {
      console.error("Session check error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (
    email: string,
    password: string,
  ) => {
    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) throw error;

      if (data.session?.user && data.session?.access_token) {
        setUser(data.session.user as User);
        setAccessToken(data.session.access_token);
      }
    } catch (error: any) {
      throw new Error(error.message || "Login failed");
    }
  };

  const handleSignup = async (
    email: string,
    password: string,
    name: string,
  ) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0cfdab42/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email, password, name }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Signup failed");
      }

      // Auto-login after successful signup
      await handleLogin(email, password);
    } catch (error: any) {
      throw new Error(error.message || "Signup failed");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
    setCurrentView("dashboard");
  };

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setCurrentView("document");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Synapse
                </h1>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  Legal Document Analyzer
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex min-h-[calc(100vh-80px)]">
          {/* Left side - Marketing */}
          <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12">
            <div className="max-w-md">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                AI-Powered Legal Document Analysis
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Automatically extract, classify, and analyze
                legal clauses with advanced AI technology.
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Risk Assessment
                    </h3>
                    <p className="text-gray-600">
                      Identify potential legal risks and
                      compliance issues automatically.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Instant Analysis
                    </h3>
                    <p className="text-gray-600">
                      Get comprehensive document analysis in
                      minutes, not hours.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Expert Insights
                    </h3>
                    <p className="text-gray-600">
                      AI-powered recommendations from legal best
                      practices.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Auth Forms */}
          <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
              <Card className="shadow-xl">
                <CardContent className="p-8">
                  {authMode === "login" ? (
                    <LoginForm
                      onLogin={handleLogin}
                      onSwitchToSignup={() =>
                        setAuthMode("signup")
                      }
                    />
                  ) : (
                    <SignupForm
                      onSignup={handleSignup}
                      onSwitchToLogin={() =>
                        setAuthMode("login")
                      }
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Synapse
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex space-x-1">
                <Button
                  variant={
                    currentView === "dashboard"
                      ? "default"
                      : "ghost"
                  }
                  onClick={() => setCurrentView("dashboard")}
                >
                  Dashboard
                </Button>
                <Button
                  variant={
                    currentView === "profile"
                      ? "default"
                      : "ghost"
                  }
                  onClick={() => setCurrentView("profile")}
                >
                  Profile
                </Button>
              </nav>

              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  {user.user_metadata?.name || user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === "dashboard" && (
          <Dashboard
            accessToken={accessToken!}
            onDocumentSelect={handleDocumentSelect}
          />
        )}

        {currentView === "document" && selectedDocumentId && (
          <DocumentViewer
            documentId={selectedDocumentId}
            accessToken={accessToken!}
            onBack={() => setCurrentView("dashboard")}
          />
        )}

        {currentView === "profile" && (
          <UserProfile user={user} accessToken={accessToken!} />
        )}
      </main>
    </div>
  );
}