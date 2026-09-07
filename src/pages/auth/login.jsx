import { useMemo, useRef, useState } from "react";
import {
    FiArrowLeft,
    FiArrowRight,
    FiEye,
    FiEyeOff,
    FiKey,
    FiLock,
    FiMail,
    FiUser,
    FiUserPlus,
} from "react-icons/fi";
import { confirmPasswordReset, login, signup, requestPasswordReset } from "../../services/authService";
import { setAuthToken, setStoredCredentials } from "../../lib/apiClient";
import { AuthLayout } from "./AuthLayout";
import { PasswordStrengthBar } from "./PasswordStrength";
import { getPasswordScore } from "./passwordScore";
import {
    errorBoxClass,
    fieldInputClass,
    fieldLabelClass,
    noticeBoxClass,
    primaryButtonClass,
} from "./authStyles";

export default function Login({ onLogin, theme, onToggleTheme }) {
    // "signin" | "register" | "forgot"
    const [mode, setMode] = useState("signin");

    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberDevice, setRememberDevice] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attempts, setAttempts] = useState(0);

    const [regUsername, setRegUsername] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regConfirmPassword, setRegConfirmPassword] = useState("");
    const [regShowPassword, setRegShowPassword] = useState(false);
    const [regError, setRegError] = useState("");
    const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
    const [signupNotice, setSignupNotice] = useState("");

    // "request" (enter email) | "code" (enter the 6-digit code) |
    // "reset" (enter new password) | "done"
    const [forgotStep, setForgotStep] = useState("request");
    const [forgotEmail, setForgotEmail] = useState("");
    const [isRequestingReset, setIsRequestingReset] = useState(false);
    const [forgotError, setForgotError] = useState("");

    // One character per box, joined into a string wherever it's sent.
    const [forgotCodeDigits, setForgotCodeDigits] = useState(["", "", "", "", "", ""]);
    const [codeError, setCodeError] = useState("");
    const [resendNotice, setResendNotice] = useState("");
    const codeInputRefs = useRef([]);

    const [forgotNewPassword, setForgotNewPassword] = useState("");
    const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
    const [forgotShowPassword, setForgotShowPassword] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [resetError, setResetError] = useState("");

    const passwordScore = useMemo(() => getPasswordScore(password), [password]);
    const regPasswordScore = useMemo(() => getPasswordScore(regPassword), [regPassword]);
    const forgotPasswordScore = useMemo(() => getPasswordScore(forgotNewPassword), [forgotNewPassword]);
    const forgotCode = forgotCodeDigits.join("");
    const isLocked = attempts >= 3;

    const switchMode = (nextMode) => {
        setMode(nextMode);
        setError("");
        setRegError("");
        setSignupNotice("");
        setForgotStep("request");
        setForgotError("");
        setForgotCodeDigits(["", "", "", "", "", ""]);
        setCodeError("");
        setResendNotice("");
        setForgotNewPassword("");
        setForgotConfirmPassword("");
        setResetError("");
    };

    const handleCodeDigitChange = (index, rawValue) => {
        const digit = rawValue.replace(/\D/g, "").slice(-1);
        setForgotCodeDigits((current) => {
            const next = [...current];
            next[index] = digit;
            return next;
        });
        if (digit && index < 5) {
            codeInputRefs.current[index + 1]?.focus();
        }
    };

    const handleCodeKeyDown = (index, e) => {
        if (e.key === "Backspace" && !forgotCodeDigits[index] && index > 0) {
            codeInputRefs.current[index - 1]?.focus();
        }
    };

    const handleCodePaste = (e) => {
        const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
        if (!digits.length) return;
        e.preventDefault();
        setForgotCodeDigits((current) => {
            const next = [...current];
            digits.forEach((digit, i) => {
                next[i] = digit;
            });
            return next;
        });
        codeInputRefs.current[Math.min(digits.length, 6) - 1]?.focus();
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();

        if (!regUsername.trim() || !regEmail.trim() || !regPassword.trim()) {
            setRegError("Fill in your username, email, and password to continue.");
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(regEmail.trim())) {
            setRegError("Enter a valid email address.");
            return;
        }

        if (regPassword !== regConfirmPassword) {
            setRegError("Passwords do not match.");
            return;
        }

        setRegError("");
        setIsRegisterSubmitting(true);

        try {
            // The username is the display name — api_user has no full_name
            // column. An admin can still rename the account later from the
            // Users page.
            await signup({
                username: regUsername.trim(),
                email: regEmail.trim(),
                password: regPassword,
            });
            setRegUsername("");
            setRegEmail("");
            setRegPassword("");
            setRegConfirmPassword("");
            setSignupNotice("Account created — an admin needs to approve it before you can sign in.");
            setMode("signin");
        } catch (err) {
            setRegError(err.message || "Could not create your account. Please try again.");
        } finally {
            setIsRegisterSubmitting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isLocked) {
            setError("Too many sign-in attempts. Please wait before trying again.");
            return;
        }

        if (!email.trim() || !password.trim()) {
            setAttempts((value) => value + 1);
            setError("Enter your email and password to continue.");
            return;
        }

        setError("");
        setSignupNotice("");
        setIsSubmitting(true);

        try {
            const response = await login(email.trim(), password);
            // Field name isn't documented by the backend yet — probe common shapes.
            const token = response?.token ?? response?.access_token ?? response?.accessToken;
            if (token) setAuthToken(token);
            // Captured fresh on every successful login so the backend's
            // still-required username/password query params (see
            // apiClient.js) always match whatever the password actually is
            // right now — including right after this same account's
            // password was changed via Account settings.
            setStoredCredentials(email.trim(), password);
            onLogin({
                user: {
                    ...response?.user,
                    name: response?.user?.username || email.trim(),
                    rememberDevice,
                },
            });
        } catch (err) {
            setAttempts((value) => value + 1);
            setError(err.message || "Invalid username or password.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();

        if (!forgotEmail.trim()) {
            setForgotError("Enter your email to continue.");
            return;
        }

        setForgotError("");
        setIsRequestingReset(true);

        try {
            await requestPasswordReset(forgotEmail.trim());
            // Same next step regardless of whether the account exists —
            // never let this confirm/deny an email to whoever's asking.
            setForgotCodeDigits(["", "", "", "", "", ""]);
            setCodeError("");
            setForgotStep("code");
        } catch (err) {
            if (err.status === 404) {
                setForgotError("This isn't set up yet — ask your system administrator to reset your password for you.");
            } else if (err.status >= 500) {
                setForgotError(err.message || "Something went wrong. Please try again.");
            } else {
                setForgotCodeDigits(["", "", "", "", "", ""]);
                setCodeError("");
                setForgotStep("code");
            }
        } finally {
            setIsRequestingReset(false);
        }
    };

    const handleResendCode = async () => {
        setCodeError("");
        setResendNotice("");
        setIsRequestingReset(true);

        try {
            await requestPasswordReset(forgotEmail.trim());
            setForgotCodeDigits(["", "", "", "", "", ""]);
            setResendNotice("A new code has been sent.");
            codeInputRefs.current[0]?.focus();
        } catch (err) {
            setCodeError(err.message || "Could not resend the code. Please try again.");
        } finally {
            setIsRequestingReset(false);
        }
    };

    // The code itself can only really be checked by backend, and the only
    // endpoint that does that also requires the new password in the same
    // call — so this step just confirms all 6 digits are filled before
    // moving on; a wrong/expired code still surfaces its real error on the
    // final submit in handleResetSubmit below.
    const handleVerifyCode = (e) => {
        e.preventDefault();

        if (!/^\d{6}$/.test(forgotCode)) {
            setCodeError("Enter all 6 digits of the code.");
            return;
        }

        setCodeError("");
        setResetError("");
        setForgotStep("reset");
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();

        if (forgotNewPassword.length < 8) {
            setResetError("New password must be at least 8 characters.");
            return;
        }

        if (forgotNewPassword !== forgotConfirmPassword) {
            setResetError("Passwords do not match.");
            return;
        }

        setResetError("");
        setIsResettingPassword(true);

        try {
            await confirmPasswordReset(forgotEmail.trim(), forgotCode, forgotNewPassword);
            setForgotStep("done");
        } catch (err) {
            setResetError(err.message || "That code is invalid or has expired. Request a new one.");
        } finally {
            setIsResettingPassword(false);
        }
    };

    return (
        <AuthLayout theme={theme} onToggleTheme={onToggleTheme}>
            {mode !== "forgot" && (
                <div className="mb-7 flex border-b border-slate-200 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={() => switchMode("signin")}
                        className={`flex-1 border-b-2 px-4 py-2.5 text-[13px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-inset ${mode === "signin"
                            ? "border-orange-500 text-orange-600 dark:text-orange-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => switchMode("register")}
                        className={`flex-1 border-b-2 px-4 py-2.5 text-[13px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-inset ${mode === "register"
                            ? "border-orange-500 text-orange-600 dark:text-orange-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                    >
                        Create Account
                    </button>
                </div>
            )}

            {mode === "signin" && signupNotice && <div className={`mb-5 ${noticeBoxClass}`}>{signupNotice}</div>}
            {mode === "signin" && error && <div className={`mb-5 ${errorBoxClass}`}>{error}</div>}
            {mode === "register" && regError && <div className={`mb-5 ${errorBoxClass}`}>{regError}</div>}

            {mode === "signin" && (
                <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
                    {/* Email Field */}
                    <div>
                        <label className={fieldLabelClass} htmlFor="email">
                            Email
                        </label>
                        <div className="relative">
                            <FiMail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                            <input
                                id="email"
                                type="email"
                                required
                                autoComplete="off"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className={fieldInputClass}
                                disabled={isSubmitting || isLocked}
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <label className={fieldLabelClass} htmlFor="password">
                            Password
                        </label>
                        <div className="relative">
                            <FiKey className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className={`${fieldInputClass} pr-11`}
                                disabled={isSubmitting || isLocked}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((value) => !value)}
                                className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                disabled={isSubmitting || isLocked}
                            >
                                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                        <PasswordStrengthBar score={passwordScore} />
                    </div>

                    {/* Options */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <label className="flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                checked={rememberDevice}
                                onChange={(e) => setRememberDevice(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800"
                                disabled={isSubmitting || isLocked}
                            />
                            <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
                                Remember this device
                            </span>
                        </label>

                        <button
                            type="button"
                            onClick={() => switchMode("forgot")}
                            className="rounded text-[13px] font-semibold text-orange-600 outline-none transition hover:text-orange-700 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-orange-400 dark:hover:text-orange-300"
                        >
                            Forgot password?
                        </button>
                    </div>

                    {/* Submit Button */}
                    <button type="submit" className={`${primaryButtonClass} mt-2`} disabled={isSubmitting || isLocked}>
                        {isSubmitting ? (
                            <>Verifying identity...</>
                        ) : (
                            <>
                                Sign In
                                <FiArrowRight size={15} />
                            </>
                        )}
                    </button>
                </form>
            )}

            {mode === "register" && (
                <form onSubmit={handleRegisterSubmit} className="space-y-5" autoComplete="off">
                    {/* Username Field */}
                    <div>
                        <label className={fieldLabelClass} htmlFor="reg-username">
                            Username
                        </label>
                        <div className="relative">
                            <FiUser className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                            <input
                                id="reg-username"
                                type="text"
                                required
                                autoComplete="off"
                                value={regUsername}
                                onChange={(e) => setRegUsername(e.target.value)}
                                placeholder="Choose a username"
                                className={fieldInputClass}
                                disabled={isRegisterSubmitting}
                            />
                        </div>
                    </div>

                    {/* Email Field */}
                    <div>
                        <label className={fieldLabelClass} htmlFor="reg-email">
                            Email
                        </label>
                        <div className="relative">
                            <FiMail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                            <input
                                id="reg-email"
                                type="email"
                                required
                                autoComplete="off"
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                                placeholder="you@company.com"
                                className={fieldInputClass}
                                disabled={isRegisterSubmitting}
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <label className={fieldLabelClass} htmlFor="reg-password">
                            Password
                        </label>
                        <div className="relative">
                            <FiKey className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                            <input
                                id="reg-password"
                                type={regShowPassword ? "text" : "password"}
                                required
                                autoComplete="new-password"
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                placeholder="Create a password"
                                className={`${fieldInputClass} pr-11`}
                                disabled={isRegisterSubmitting}
                            />
                            <button
                                type="button"
                                onClick={() => setRegShowPassword((value) => !value)}
                                className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                aria-label={regShowPassword ? "Hide password" : "Show password"}
                                disabled={isRegisterSubmitting}
                            >
                                {regShowPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                        <PasswordStrengthBar score={regPasswordScore} />
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                        <label className={fieldLabelClass} htmlFor="reg-confirm-password">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <FiKey className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                            <input
                                id="reg-confirm-password"
                                type={regShowPassword ? "text" : "password"}
                                required
                                autoComplete="new-password"
                                value={regConfirmPassword}
                                onChange={(e) => setRegConfirmPassword(e.target.value)}
                                placeholder="Re-enter your password"
                                className={fieldInputClass}
                                disabled={isRegisterSubmitting}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button type="submit" className={`${primaryButtonClass} mt-2`} disabled={isRegisterSubmitting}>
                        {isRegisterSubmitting ? (
                            <>Creating account...</>
                        ) : (
                            <>
                                Create account
                                <FiUserPlus size={15} />
                            </>
                        )}
                    </button>
                </form>
            )}

            {mode === "forgot" && forgotStep === "request" && (
                <>
                    <div className="mb-6">
                        <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">Reset your password</h2>
                        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                            Enter your email and we'll send a 6-digit code to it.
                        </p>
                    </div>

                    {forgotError && <div className={`mb-5 ${errorBoxClass}`}>{forgotError}</div>}

                    <form onSubmit={handleForgotSubmit} className="space-y-5" autoComplete="off">
                        <div>
                            <label className={fieldLabelClass} htmlFor="forgot-email">
                                Email
                            </label>
                            <div className="relative">
                                <FiMail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                                <input
                                    id="forgot-email"
                                    type="email"
                                    required
                                    autoComplete="off"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className={fieldInputClass}
                                    disabled={isRequestingReset}
                                />
                            </div>
                        </div>

                        <button type="submit" className={primaryButtonClass} disabled={isRequestingReset}>
                            {isRequestingReset ? "Sending..." : "Send code"}
                        </button>
                    </form>

                    <button
                        type="button"
                        onClick={() => switchMode("signin")}
                        className="mt-5 inline-flex items-center gap-1.5 rounded text-[13px] font-semibold text-slate-600 outline-none transition hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                        <FiArrowLeft size={14} />
                        Back to Sign In
                    </button>
                </>
            )}

            {mode === "forgot" && forgotStep === "code" && (
                <>
                    <div className="mb-6 flex flex-col items-center text-center">
                        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 ring-1 ring-orange-200 dark:bg-orange-500/10 dark:ring-orange-500/30">
                            <FiLock className="text-orange-500 dark:text-orange-400" size={22} />
                        </div>
                        <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">Enter your code</h2>
                        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                            If an account exists for {forgotEmail.trim()}, a 6-digit code was sent to it. It expires in 10 minutes.
                        </p>
                    </div>

                    {codeError && <div className={`mb-5 ${errorBoxClass}`}>{codeError}</div>}
                    {!codeError && resendNotice && <div className={`mb-5 ${noticeBoxClass}`}>{resendNotice}</div>}

                    <form onSubmit={handleVerifyCode} className="space-y-6" autoComplete="off">
                        <div className="flex justify-between gap-2">
                            {forgotCodeDigits.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (codeInputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    autoComplete="off"
                                    value={digit}
                                    onChange={(e) => handleCodeDigitChange(index, e.target.value)}
                                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                                    onPaste={handleCodePaste}
                                    disabled={isRequestingReset}
                                    aria-label={`Digit ${index + 1} of 6`}
                                    className="h-14 w-full rounded-xl border border-slate-200 bg-white text-center text-lg font-semibold text-slate-900 outline-none transition focus:border-orange-400 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            ))}
                        </div>

                        <button type="submit" className={primaryButtonClass} disabled={isRequestingReset}>
                            Verify Code
                        </button>
                    </form>

                    <div className="mt-5 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => switchMode("signin")}
                            className="inline-flex items-center gap-1.5 rounded text-[13px] font-semibold text-slate-600 outline-none transition hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                            <FiArrowLeft size={14} />
                            Back to Sign In
                        </button>
                        <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={isRequestingReset}
                            className="rounded text-[13px] font-semibold text-orange-600 outline-none transition hover:text-orange-700 focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-50 dark:text-orange-400 dark:hover:text-orange-300"
                        >
                            {isRequestingReset ? "Sending..." : "Resend Code"}
                        </button>
                    </div>
                </>
            )}

            {mode === "forgot" && forgotStep === "reset" && (
                <>
                    <div className="mb-6">
                        <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">Set a new password</h2>
                        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">Code verified — choose a new password below.</p>
                    </div>

                    {resetError && <div className={`mb-5 ${errorBoxClass}`}>{resetError}</div>}

                    <form onSubmit={handleResetSubmit} className="space-y-5" autoComplete="off">
                        <div>
                            <label className={fieldLabelClass} htmlFor="forgot-new-password">
                                New Password
                            </label>
                            <div className="relative">
                                <FiKey className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                                <input
                                    id="forgot-new-password"
                                    type={forgotShowPassword ? "text" : "password"}
                                    required
                                    autoComplete="new-password"
                                    value={forgotNewPassword}
                                    onChange={(e) => setForgotNewPassword(e.target.value)}
                                    placeholder="Create a new password"
                                    className={`${fieldInputClass} pr-11`}
                                    disabled={isResettingPassword}
                                />
                                <button
                                    type="button"
                                    onClick={() => setForgotShowPassword((value) => !value)}
                                    className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                    aria-label={forgotShowPassword ? "Hide password" : "Show password"}
                                    disabled={isResettingPassword}
                                >
                                    {forgotShowPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                </button>
                            </div>
                            <PasswordStrengthBar score={forgotPasswordScore} />
                        </div>

                        <div>
                            <label className={fieldLabelClass} htmlFor="forgot-confirm-password">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <FiKey className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                                <input
                                    id="forgot-confirm-password"
                                    type={forgotShowPassword ? "text" : "password"}
                                    required
                                    autoComplete="new-password"
                                    value={forgotConfirmPassword}
                                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                                    placeholder="Re-enter your new password"
                                    className={fieldInputClass}
                                    disabled={isResettingPassword}
                                />
                            </div>
                        </div>

                        <button type="submit" className={primaryButtonClass} disabled={isResettingPassword}>
                            {isResettingPassword ? "Resetting..." : "Reset password"}
                        </button>
                    </form>

                    <div className="mt-5 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => switchMode("signin")}
                            className="inline-flex items-center gap-1.5 rounded text-[13px] font-semibold text-slate-600 outline-none transition hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                            <FiArrowLeft size={14} />
                            Back to Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setForgotStep("code");
                                setResetError("");
                            }}
                            className="rounded text-[13px] font-semibold text-orange-600 outline-none transition hover:text-orange-700 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-orange-400 dark:hover:text-orange-300"
                        >
                            Change code
                        </button>
                    </div>
                </>
            )}

            {mode === "forgot" && forgotStep === "done" && (
                <>
                    <div className="mb-6">
                        <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">Password reset</h2>
                    </div>

                    <div className={noticeBoxClass}>Your password has been reset. You can now sign in with your new password.</div>

                    <button type="button" onClick={() => switchMode("signin")} className={`${primaryButtonClass} mt-5`}>
                        Back to Sign In
                        <FiArrowRight size={15} />
                    </button>
                </>
            )}
        </AuthLayout>
    );
}
