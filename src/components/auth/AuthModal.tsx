"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Label,
} from "@/components/ds";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  type SignInParams,
  type SignUpParams,
  type ForgotPasswordParams,
} from "@/lib/validation/schemas";

type AuthView = "login" | "register" | "forgot-password";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: AuthView;
}

export function AuthModal({ open, onOpenChange, defaultView = "login" }: AuthModalProps) {
  const [view, setView] = useState<AuthView>(defaultView);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const t = useTranslations();
  const { signIn, signInEmail, signUpEmail, resetPassword } = useAuth();

  // Login form
  const loginForm = useForm<SignInParams>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  // Register form
  const registerForm = useForm<SignUpParams>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", displayName: "" },
  });

  // Forgot password form
  const forgotForm = useForm<ForgotPasswordParams>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn();
      onOpenChange(false);
      toast.success(t("auth.loginSuccess"));
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (data: SignInParams) => {
    try {
      setIsLoading(true);
      await signInEmail(data.email, data.password);
      onOpenChange(false);
      toast.success(t("auth.loginSuccess"));
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async (data: SignUpParams) => {
    try {
      setIsLoading(true);
      await signUpEmail(data.email, data.password, data.displayName);
      onOpenChange(false);
      toast.success(t("auth.registerSuccess"));
      toast.info(t("auth.verificationEmailSent"));
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordParams) => {
    try {
      setIsLoading(true);
      await resetPassword(data.email);
      toast.success(t("auth.resetEmailSent"));
      setView("login");
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthError = (error: { code?: string; message?: string }) => {
    const code = error?.code || "unknown";
    const message = error?.message || "";

    console.error("Auth error:", code, message);

    switch (code) {
      case "auth/email-already-in-use":
        toast.error(t("auth.errors.emailAlreadyInUse"));
        break;
      case "auth/invalid-email":
        toast.error(t("auth.errors.invalidEmail"));
        break;
      case "auth/operation-not-allowed":
        toast.error(t("auth.errors.operationNotAllowed"));
        break;
      case "auth/weak-password":
        toast.error(t("auth.errors.weakPassword"));
        break;
      case "auth/user-disabled":
        toast.error(t("auth.errors.userDisabled"));
        break;
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        toast.error(t("auth.errors.invalidCredentials"), {
          duration: 5000,
        });
        break;
      case "auth/too-many-requests":
        toast.error(t("auth.errors.tooManyRequests"));
        break;
      case "auth/configuration-not-found":
        toast.error(t("errors.authConfigNotFound"));
        break;
      default:
        toast.error(message || t("errors.generic"));
    }
  };

  const resetForms = () => {
    loginForm.reset();
    registerForm.reset();
    forgotForm.reset();
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchView = (newView: AuthView) => {
    resetForms();
    setView(newView);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {view === "login" && t("auth.loginTitle")}
            {view === "register" && t("auth.registerTitle")}
            {view === "forgot-password" && t("auth.forgotPasswordTitle")}
          </DialogTitle>
          <DialogDescription>
            {view === "login" && t("auth.loginDescription")}
            {view === "register" && t("auth.registerDescription")}
            {view === "forgot-password" && t("auth.forgotPasswordDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Google Sign In Button */}
          {view !== "forgot-password" && (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Image src="/google.svg" alt="Google" width={16} height={16} className="mr-2" />
                )}
                {t("common.loginWithGoogle")}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background text-muted-foreground px-2">
                    {t("auth.orContinueWith")}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Login Form */}
          {view === "login" && (
            <form onSubmit={loginForm.handleSubmit(handleEmailLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">{t("auth.email")}</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  {...loginForm.register("email")}
                  disabled={isLoading}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-destructive text-sm">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">{t("auth.password")}</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.passwordPlaceholder")}
                    {...loginForm.register("password")}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="text-muted-foreground h-4 w-4" />
                    ) : (
                      <Eye className="text-muted-foreground h-4 w-4" />
                    )}
                  </Button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-destructive text-sm">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant="link"
                className="px-0 text-sm"
                onClick={() => switchView("forgot-password")}
              >
                {t("auth.forgotPassword")}
              </Button>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                {t("auth.loginWithEmail")}
              </Button>

              <p className="text-muted-foreground text-center text-sm">
                {t("auth.noAccount")}{" "}
                <Button
                  type="button"
                  variant="link"
                  className="px-0"
                  onClick={() => switchView("register")}
                >
                  {t("auth.signUp")}
                </Button>
              </p>
            </form>
          )}

          {/* Register Form */}
          {view === "register" && (
            <form onSubmit={registerForm.handleSubmit(handleEmailRegister)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">{t("auth.displayName")}</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder={t("auth.displayNamePlaceholder")}
                  {...registerForm.register("displayName")}
                  disabled={isLoading}
                />
                {registerForm.formState.errors.displayName && (
                  <p className="text-destructive text-sm">
                    {registerForm.formState.errors.displayName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">{t("auth.email")}</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  {...registerForm.register("email")}
                  disabled={isLoading}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-destructive text-sm">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">{t("auth.password")}</Label>
                <div className="relative">
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.passwordPlaceholder")}
                    {...registerForm.register("password")}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="text-muted-foreground h-4 w-4" />
                    ) : (
                      <Eye className="text-muted-foreground h-4 w-4" />
                    )}
                  </Button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-destructive text-sm">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm-password">{t("auth.confirmPassword")}</Label>
                <div className="relative">
                  <Input
                    id="register-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("auth.confirmPasswordPlaceholder")}
                    {...registerForm.register("confirmPassword")}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="text-muted-foreground h-4 w-4" />
                    ) : (
                      <Eye className="text-muted-foreground h-4 w-4" />
                    )}
                  </Button>
                </div>
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-destructive text-sm">
                    {registerForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <p className="text-muted-foreground text-xs">{t("auth.passwordRequirements")}</p>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                {t("auth.createAccount")}
              </Button>

              <p className="text-muted-foreground text-center text-sm">
                {t("auth.hasAccount")}{" "}
                <Button
                  type="button"
                  variant="link"
                  className="px-0"
                  onClick={() => switchView("login")}
                >
                  {t("auth.signIn")}
                </Button>
              </p>
            </form>
          )}

          {/* Forgot Password Form */}
          {view === "forgot-password" && (
            <form onSubmit={forgotForm.handleSubmit(handleForgotPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">{t("auth.email")}</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  {...forgotForm.register("email")}
                  disabled={isLoading}
                />
                {forgotForm.formState.errors.email && (
                  <p className="text-destructive text-sm">
                    {forgotForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                {t("auth.sendResetLink")}
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => switchView("login")}
              >
                {t("auth.backToLogin")}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
