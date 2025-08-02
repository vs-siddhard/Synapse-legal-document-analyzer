import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";

interface SignupFormProps {
  onSignup: (
    email: string,
    password: string,
    name: string,
  ) => Promise<void>;
  onSwitchToLogin: () => void;
}

export default function SignupForm({
  onSignup,
  onSwitchToLogin,
}: SignupFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const passwordRequirements = [
    {
      test: (pwd: string) => pwd.length >= 8,
      text: "At least 8 characters",
    },
    {
      test: (pwd: string) => /[A-Z]/.test(pwd),
      text: "One uppercase letter",
    },
    {
      test: (pwd: string) => /[a-z]/.test(pwd),
      text: "One lowercase letter",
    },
    {
      test: (pwd: string) => /\d/.test(pwd),
      text: "One number",
    },
  ];

  const isPasswordValid = passwordRequirements.every((req) =>
    req.test(password),
  );
  const doPasswordsMatch =
    password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!acceptTerms) {
      setError("Please accept the terms and conditions");
      return;
    }

    if (!isPasswordValid) {
      setError("Password does not meet requirements");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await onSignup(email, password, name);
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Create account
        </h2>
        <p className="text-gray-600 mt-2">
          Start analyzing legal documents with AI
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {password && (
            <div className="mt-2 space-y-1">
              {passwordRequirements.map((req, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 text-xs"
                >
                  <div
                    className={`w-3 h-3 rounded-full flex items-center justify-center ${
                      req.test(password)
                        ? "bg-green-100"
                        : "bg-gray-100"
                    }`}
                  >
                    {req.test(password) && (
                      <Check className="w-2 h-2 text-green-600" />
                    )}
                  </div>
                  <span
                    className={
                      req.test(password)
                        ? "text-green-600"
                        : "text-gray-500"
                    }
                  >
                    {req.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            Confirm password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              placeholder="Confirm your password"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              disabled={loading}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {confirmPassword && (
            <div className="flex items-center space-x-2 text-xs mt-1">
              <div
                className={`w-3 h-3 rounded-full flex items-center justify-center ${
                  doPasswordsMatch
                    ? "bg-green-100"
                    : "bg-red-100"
                }`}
              >
                {doPasswordsMatch && (
                  <Check className="w-2 h-2 text-green-600" />
                )}
              </div>
              <span
                className={
                  doPasswordsMatch
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {doPasswordsMatch
                  ? "Passwords match"
                  : "Passwords do not match"}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="terms"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            disabled={loading}
          />
          <Label
            htmlFor="terms"
            className="text-sm text-gray-600"
          >
            I agree to the{" "}
            <a
              href="#"
              className="text-blue-600 hover:text-blue-500"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-blue-600 hover:text-blue-500"
            >
              Privacy Policy
            </a>
          </Label>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={
            loading ||
            !isPasswordValid ||
            !doPasswordsMatch ||
            !acceptTerms
          }
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-500 font-medium"
            disabled={loading}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}