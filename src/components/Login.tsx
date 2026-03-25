import React from "react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
} from "./ui/card";
import { Spinner } from "./ui/spinner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "./ui/dialog";
import { Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";
import { authService } from "../services/authService";
import { FirebaseError } from "firebase/app";

function getFirebaseErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Invalid email or password. Please try again.";
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/weak-password":
        return "Password must be at least 6 characters long.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      case "auth/network-request-failed":
        return "Network error. Please check your connection.";
      default:
        return "Something went wrong. Please try again.";
    }
  }
  return "Something went wrong. Please try again.";
}

export function Login() {
  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Register state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);

  // Forgot password state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const splineContainerRef = useRef<HTMLDivElement>(null);

  // Lock Spline model position - allow rotation (left-click drag) but block panning (right/middle-click drag)
  useEffect(() => {
    const container = splineContainerRef.current;
    if (!container) return;

    const blockPan = (e: PointerEvent) => {
      if (e.button !== 0) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    container.addEventListener("pointerdown", blockPan, true);
    container.addEventListener("contextmenu", blockContextMenu, true);

    return () => {
      container.removeEventListener("pointerdown", blockPan, true);
      container.removeEventListener("contextmenu", blockContextMenu, true);
    };
  }, []);

  // Load Spline viewer script
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "module";
    script.src =
      "https://unpkg.com/@splinetool/viewer@1.12.52/build/spline-viewer.js";
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoginLoading(true);
    try {
      await authService.login(email, password);
      // onAuthStateChanged in useAuth hook will update the store automatically
    } catch (error) {
      setLoginError(getFirebaseErrorMessage(error));
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setRegisterError("");

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError("Passwords do not match.");
      return;
    }
    if (registerPassword.length < 6) {
      setRegisterError("Password must be at least 6 characters long.");
      return;
    }

    setIsRegisterLoading(true);
    try {
      await authService.register(registerEmail, registerPassword, registerName);
      // onAuthStateChanged will fire and log the user in automatically
      setIsRegisterOpen(false);
    } catch (error) {
      setRegisterError(getFirebaseErrorMessage(error));
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess(false);
    setIsForgotLoading(true);
    try {
      await authService.resetPassword(forgotEmail);
      setForgotSuccess(true);
    } catch (error) {
      setForgotError(getFirebaseErrorMessage(error));
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-between bg-background px-4 py-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-muted/5"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--primary)/10,_transparent)]"></div>
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,_transparent,_transparent_20px,_var(--secondary)/20_20px,_var(--secondary)/20_40px)]"></div>

      {/* Login Form - Left Side */}
      <div className="w-full max-w-md ml-8 md:ml-16 lg:ml-50 relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4 shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
          >
            <img
              src="https://scontent.fcrk3-3.fna.fbcdn.net/v/t39.30808-6/473699661_1025223302959950_3021819648282754534_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=1d70fc&_nc_eui2=AeED3aYsjbeBhOXxI8vv0i_gvfnKNwSgKpG9-co3BKAqkYSFstX1lbpDzxrPKQP9jzfuDR4PPgKwTb-fU28AjM7_&_nc_ohc=dAT5dxR4ZjAQ7kNvwGOK7Ew&_nc_oc=AdrWSmo_n7iOEDBZFAYwugEwnRUpgN5Mlo1w7JIl4UaCglUFpWV0urOtxzCRQIwwzRo&_nc_zt=23&_nc_ht=scontent.fcrk3-3.fna&_nc_gid=x6QTayGJZFCofTVTEvq3Vg&_nc_ss=7a32e&oh=00_AfyijTAJmVe1z5Yzj7Ee1-u3w7Oj1MPg-AgFKpy1tob79A&oe=69C6A0EC"
              alt="Cake with Joy Logo"
              className="w-full h-full object-cover"
            />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-2 text-3xl font-bold tracking-wide"
          >
            Cake with Joy
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-muted-foreground"
          >
            Sign in to continue to your account
          </motion.p>
        </motion.div>

        {/* Login Card */}
        <Card className="shadow-2xl hover:shadow-xl transition-shadow">
          <CardHeader className="bg-primary/10 rounded-t-lg p-6">
            <motion.h2
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-xl font-bold text-primary"
            >
              Welcome Back
            </motion.h2>
            <motion.p
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="text-muted-foreground"
            >
              Enter your credentials to access your account
            </motion.p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="space-y-2"
              >
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 pr-4 py-3 bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 focus:border-primary/70 transition-all"
                    required
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="space-y-2"
              >
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-4 py-3 bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 focus:border-primary/70 transition-all"
                    required
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="text-center"
              >
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isLoginLoading}
                >
                  {isLoginLoading ? (
                    <div className="flex items-center justify-center">
                      <Spinner className="w-4 h-4 mr-2" />
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </motion.div>

              {/* Forgot Password */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.1 }}
                className="text-center"
              >
                <Dialog
                  open={isForgotOpen}
                  onOpenChange={(open: boolean) => {
                    setIsForgotOpen(open);
                    if (!open) {
                      setForgotEmail("");
                      setForgotError("");
                      setForgotSuccess(false);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot password?
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-white border border-border/50">
                    <DialogHeader className="p-6 pb-0">
                      <h3 className="text-xl font-bold text-primary">Reset Password</h3>
                      <p className="text-muted-foreground">
                        Enter your email and we'll send you a reset link.
                      </p>
                    </DialogHeader>
                    <form onSubmit={handleForgotPassword} className="space-y-4 p-6">
                      {forgotSuccess ? (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                          <CheckCircle className="w-5 h-5 shrink-0" />
                          <p>
                            Reset link sent to <strong>{forgotEmail}</strong>. Check your inbox.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="forgot-email">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="forgot-email"
                                type="email"
                                placeholder="Enter your email"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                className="pl-10 pr-4 py-3"
                                required
                              />
                            </div>
                          </div>
                          {forgotError && (
                            <div className="flex items-center gap-2 text-red-500">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span className="text-sm">{forgotError}</span>
                            </div>
                          )}
                          <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90"
                            disabled={isForgotLoading}
                          >
                            {isForgotLoading ? (
                              <div className="flex items-center justify-center">
                                <Spinner className="w-4 h-4 mr-2" />
                                Sending...
                              </div>
                            ) : (
                              "Send Reset Link"
                            )}
                          </Button>
                        </>
                      )}
                    </form>
                  </DialogContent>
                </Dialog>
              </motion.div>

              {loginError && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex items-center gap-2 text-red-500 text-sm"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {loginError}
                </motion.div>
              )}
            </form>

            {/* Sign Up */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.3 }}
              className="mt-6 text-center"
            >
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                  <DialogTrigger asChild>
                    <button className="text-primary hover:underline">
                      Sign up
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-white border border-border/50">
                    <DialogHeader className="p-6 pb-0">
                      <motion.h3
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-xl font-bold text-primary"
                      >
                        Create Account
                      </motion.h3>
                      <motion.p
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-muted-foreground"
                      >
                        Fill in your details to create a new account
                      </motion.p>
                    </DialogHeader>

                    <motion.form
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      onSubmit={handleRegister}
                      className="space-y-4 p-6"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="register-name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="register-name"
                            type="text"
                            placeholder="Enter your full name"
                            value={registerName}
                            onChange={(e) => setRegisterName(e.target.value)}
                            className="pl-10 pr-4 py-3 bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 focus:border-primary/70 transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="register-email"
                            type="email"
                            placeholder="Enter your email"
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                            className="pl-10 pr-4 py-3 bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 focus:border-primary/70 transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="register-password"
                            type="password"
                            placeholder="Create a password (min. 6 characters)"
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            className="pl-10 pr-4 py-3 bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 focus:border-primary/70 transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-confirm-password">
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="register-confirm-password"
                            type="password"
                            placeholder="Confirm your password"
                            value={registerConfirmPassword}
                            onChange={(e) =>
                              setRegisterConfirmPassword(e.target.value)
                            }
                            className="pl-10 pr-4 py-3 bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 focus:border-primary/70 transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-secondary/20 rounded-lg border border-border">
                        <p className="text-sm text-muted-foreground">
                          By creating an account, you agree to our Terms of
                          Service and Privacy Policy.
                        </p>
                      </div>

                      {registerError && (
                        <div className="flex items-center gap-2 text-red-500 text-sm">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {registerError}
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={isRegisterLoading}
                      >
                        {isRegisterLoading ? (
                          <div className="flex items-center justify-center">
                            <Spinner className="w-4 h-4 mr-2" />
                            Creating account...
                          </div>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </motion.form>
                  </DialogContent>
                </Dialog>
              </p>
            </motion.div>
          </CardContent>
        </Card>

        {/* Test Credentials Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.4 }}
          className="mt-6 p-4 bg-card rounded-lg border border-border shadow-sm"
        >
          <p className="text-center mb-3">
            <strong>Test Accounts</strong>
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center px-2">
              <span className="text-muted-foreground">Admin:</span>
              <code className="bg-muted px-2 py-1 rounded">
                admin@cakewjoy.com / admin123
              </code>
            </div>
            <div className="flex justify-between items-center px-2">
              <span className="text-muted-foreground">Staff:</span>
              <code className="bg-muted px-2 py-1 rounded">
                staff@cakewjoy.com / staff123
              </code>
            </div>
            <div className="flex justify-between items-center px-2">
              <span className="text-muted-foreground">Customer:</span>
              <code className="bg-muted px-2 py-1 rounded">
                customer@cakewjoy.com / customer123
              </code>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3D Model - Right Side */}
      <div ref={splineContainerRef} className="hidden lg:block absolute right-0 top-0 bottom-0 w-1/2">
        {/* @ts-ignore */}
        <spline-viewer
          url="https://prod.spline.design/PTJ4GDCbIcFR5XBL/scene.splinecode"
          style={{ width: "100%", height: "100%", transform: "scale(1.2)" }}
        />
      </div>
    </div>
  );
}
