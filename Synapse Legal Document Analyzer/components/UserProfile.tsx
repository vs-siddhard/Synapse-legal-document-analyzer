import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";
import {
  User,
  Mail,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  Save,
  CreditCard,
  Shield,
  Bell,
  Download,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { projectId } from "../utils/supabase/info";

interface UserProfileProps {
  user: {
    id: string;
    email: string;
    user_metadata: {
      name: string;
    };
  };
  accessToken: string;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  created_at: string;
  documents_analyzed: number;
  subscription_tier: string;
  updated_at?: string;
}

export default function UserProfile({
  user,
  accessToken,
}: UserProfileProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    notifications: true,
    autoAnalysis: true,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

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
        setFormData({
          name: data.profile.name || "",
          email: data.profile.email || "",
          notifications: true,
          autoAnalysis: true,
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0cfdab42/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setMessage({
          type: "success",
          text: "Profile updated successfully!",
        });
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const usageStats = [
    {
      label: "Documents Analyzed",
      value: profile?.documents_analyzed || 0,
      icon: FileText,
      color: "text-blue-600",
    },
    {
      label: "Total Clauses Reviewed",
      value: (profile?.documents_analyzed || 0) * 12,
      icon: BarChart3,
      color: "text-green-600",
    },
    {
      label: "Risk Assessments",
      value: (profile?.documents_analyzed || 0) * 8,
      icon: Shield,
      color: "text-orange-600",
    },
    {
      label: "AI Consultations",
      value: (profile?.documents_analyzed || 0) * 5,
      icon: User,
      color: "text-purple-600",
    },
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Profile Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your account and preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            {profile?.subscription_tier || "Free"} Plan
          </Badge>
        </div>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {profile?.name || "User"}
              </CardTitle>
              <CardDescription className="flex items-center mt-1">
                <Mail className="w-4 h-4 mr-2" />
                {profile?.email}
              </CardDescription>
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <Calendar className="w-4 h-4 mr-2" />
                Member since{" "}
                {profile?.created_at
                  ? formatDate(profile.created_at)
                  : "N/A"}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {usageStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Settings */}
      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="preferences">
            Preferences
          </TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Account Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact
                information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {message && (
                <Alert
                  variant={
                    message.type === "error"
                      ? "destructive"
                      : "default"
                  }
                >
                  {message.type === "success" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified about
                analysis results and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">
                    Analysis Complete
                  </p>
                  <p className="text-sm text-gray-600">
                    Get notified when document analysis is
                    finished
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifications}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notifications: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Auto-Analysis</p>
                  <p className="text-sm text-gray-600">
                    Automatically start analysis when documents
                    are uploaded
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoAnalysis}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      autoAnalysis: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>
                Download your analysis data and reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export All Analysis Reports (PDF)
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Usage Statistics (CSV)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Subscription & Billing
              </CardTitle>
              <CardDescription>
                Manage your subscription and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Current Plan
                    </h3>
                    <p className="text-gray-600">Free Tier</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    Active
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">
                      Documents per month
                    </p>
                    <p className="text-lg font-semibold">
                      5 / 10 used
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      AI consultations
                    </p>
                    <p className="text-lg font-semibold">
                      50 / 100 used
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      Storage
                    </p>
                    <p className="text-lg font-semibold">
                      1.2 GB / 5 GB
                    </p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <h4 className="font-medium">
                    Upgrade Options
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium">
                        Professional
                      </h5>
                      <p className="text-2xl font-bold">
                        $29
                        <span className="text-sm font-normal">
                          /month
                        </span>
                      </p>
                      <ul className="text-sm text-gray-600 mt-2 space-y-1">
                        <li>• 100 documents/month</li>
                        <li>• Unlimited AI consultations</li>
                        <li>• 50 GB storage</li>
                        <li>• Priority support</li>
                      </ul>
                      <Button className="w-full mt-4">
                        Upgrade to Pro
                      </Button>
                    </div>

                    <div className="border rounded-lg p-4 border-blue-200 bg-blue-50">
                      <h5 className="font-medium">
                        Enterprise
                      </h5>
                      <p className="text-2xl font-bold">
                        $99
                        <span className="text-sm font-normal">
                          /month
                        </span>
                      </p>
                      <ul className="text-sm text-gray-600 mt-2 space-y-1">
                        <li>• Unlimited documents</li>
                        <li>• Advanced AI features</li>
                        <li>• Unlimited storage</li>
                        <li>• Custom integrations</li>
                      </ul>
                      <Button
                        className="w-full mt-4"
                        variant="outline"
                      >
                        Contact Sales
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and privacy
                settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      Two-Factor Authentication
                    </p>
                    <p className="text-sm text-gray-600">
                      Add an extra layer of security to your
                      account
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable 2FA
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-gray-600">
                      Last changed 3 months ago
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      Active Sessions
                    </p>
                    <p className="text-sm text-gray-600">
                      Manage devices signed into your account
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Sessions
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-red-600">
                  Danger Zone
                </h4>
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <p className="font-medium text-red-900">
                    Delete Account
                  </p>
                  <p className="text-sm text-red-700 mb-3">
                    Permanently delete your account and all
                    associated data. This action cannot be
                    undone.
                  </p>
                  <Button variant="destructive" size="sm">
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}