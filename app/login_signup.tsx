import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
	ActivityIndicator,
	Animated,
	BackHandler,
	Easing,
	Image,
	Keyboard,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
	checkEmailExistsInUsers,
	sendOtpToEmail,
	touchUserLastLogin,
	upsertSignupProfile,
	verifyEmailOtp,
} from "@/services/emailAuthService";

type AuthMode = "signup" | "login";
type FieldErrors = {
	firstName?: string;
	lastName?: string;
	email?: string;
};

export default function LoginSignupScreen() {
	const router = useRouter();
	const [mode, setMode] = useState<AuthMode>("signup");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [toggleWidth, setToggleWidth] = useState(0);
	const [focusedField, setFocusedField] = useState<"firstName"|"lastName"|"email"|null>(null);
	const [isSwitching, setIsSwitching] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
	const [authError, setAuthError] = useState("");
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [otpError, setOtpError] = useState("");
	const [otpModalVisible, setOtpModalVisible] = useState(false);
	const [otpCode, setOtpCode] = useState("");
	const [otpCountdown, setOtpCountdown] = useState(300);
	const [resendCountdown, setResendCountdown] = useState(60);
	const [pendingEmail, setPendingEmail] = useState("");
	const [pendingFirstName, setPendingFirstName] = useState("");
	const [pendingLastName, setPendingLastName] = useState("");
	const [pendingMode, setPendingMode] = useState<AuthMode>("signup");

	const contentOpacity = useRef(new Animated.Value(1)).current;
	const contentTranslateX = useRef(new Animated.Value(0)).current;
	const toggleAnim = useRef(new Animated.Value(0)).current;
	const isSwitchingRef = useRef(false);

	const handleModeChange = (nextMode: AuthMode) => {
		if (nextMode === mode || isSwitchingRef.current) return;
		isSwitchingRef.current = true;
		setIsSwitching(true);

		const dir = nextMode === "login" ? -1 : 1;
		const slideDistance = 44;

		Animated.spring(toggleAnim, {
			toValue: nextMode === "login" ? 1 : 0,
			useNativeDriver: true,
			stiffness: 180,
			damping: 24,
			mass: 0.85,
		}).start();

		Animated.parallel([
			Animated.timing(contentOpacity, {
				toValue: 0,
				duration: 110,
				easing: Easing.out(Easing.cubic),
				useNativeDriver: true,
			}),
			Animated.timing(contentTranslateX, {
				toValue: dir * slideDistance,
				duration: 110,
				easing: Easing.out(Easing.cubic),
				useNativeDriver: true,
			}),
		]).start(() => {
			setMode(nextMode);
			setAuthError("");
			setFieldErrors({});
			setOtpError("");
			contentTranslateX.setValue(-dir * slideDistance);
			contentOpacity.setValue(0);

			Animated.parallel([
				Animated.timing(contentOpacity, {
					toValue: 1,
					duration: 160,
					easing: Easing.out(Easing.cubic),
					useNativeDriver: true,
				}),
				Animated.timing(contentTranslateX, {
					toValue: 0,
					duration: 160,
					easing: Easing.out(Easing.cubic),
					useNativeDriver: true,
				}),
			]).start(() => {
				isSwitchingRef.current = false;
				setIsSwitching(false);
			});
		});
	};

	const isSignup = mode === "signup";
	const heading = useMemo(() => (isSignup ? "Create an Account" : "Welcome Back!"), [isSignup]);
	const ctaLabel = useMemo(() => (isSignup ? "Sign Up" : "Login"), [isSignup]);

	const formatOtpTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const getSubmitValidationErrors = (currentMode: AuthMode, values: { email: string; firstName: string; lastName: string; }) => {
		const nextErrors: FieldErrors = {};

		if (!values.email) {
			nextErrors.email = "1";
		}

		if (currentMode === "signup") {
			if (!values.firstName) {
				nextErrors.firstName = "1";
			}

			if (!values.lastName) {
				nextErrors.lastName = "1";
			}
		}

		return nextErrors;
	};

	useEffect(() => {
		if (!otpModalVisible) return;

		const timer = setInterval(() => {
			setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
			setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
		}, 1000);

		return () => clearInterval(timer);
	}, [otpModalVisible]);

	const handleAuthSubmit = async () => {
		if (isSubmitting) return;
		setAuthError("");
		setOtpError("");

		const cleanEmail = email.trim().toLowerCase();
		const cleanFirstName = firstName.trim();
		const cleanLastName = lastName.trim();
		const validationErrors = getSubmitValidationErrors(mode, {
			email: cleanEmail,
			firstName: cleanFirstName,
			lastName: cleanLastName,
		});
		setFieldErrors(validationErrors);

		if (Object.keys(validationErrors).length > 0) {
			setAuthError(isSignup ? "Signup Failed: Fill required fields" : "Login Failed: Fill required fields");
			return;
		}

		setIsSubmitting(true);
		try {
			const emailExists = await checkEmailExistsInUsers(cleanEmail);

			if (isSignup && emailExists) {
				setAuthError("Email already used");
				return;
			}

			if (!isSignup && !emailExists) {
				setAuthError("Email not existing");
				return;
			}

			await sendOtpToEmail(cleanEmail, isSignup);
			setPendingEmail(cleanEmail);
			setPendingFirstName(cleanFirstName);
			setPendingLastName(cleanLastName);
			setPendingMode(mode);
			setOtpCode("");
			setOtpError("");
			setOtpCountdown(300);
			setResendCountdown(60);
			setOtpModalVisible(true);
		} catch (error: any) {
			console.error("Signup/login error", error);
			console.error("Signup/login error details", {
				message: error?.message,
				status: error?.status,
				details: error?.details,
				hint: error?.hint,
				response: error?.response,
			});
			const message =
				error?.message ||
				error?.error_description ||
				(error?.response && (error.response.error_description || error.response.message)) ||
				"Unexpected authentication error";
			setAuthError(isSignup ? `Signup Failed: ${message}` : `Login Failed: ${message}`);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleVerifyOtp = async () => {
		if (isVerifyingOtp) return;
		const cleanCode = otpCode.trim();
		if (cleanCode.length !== 6) {
			setOtpError("Code is invalid or expired");
			return;
		}

		setIsVerifyingOtp(true);
		setOtpError("");
		try {
			const user = await verifyEmailOtp(pendingEmail, cleanCode);
			if (!user) throw new Error("Verification failed. Please try again.");

			if (pendingMode === "signup") {
				await upsertSignupProfile({
					id: user.id,
					email: pendingEmail,
					first_name: pendingFirstName,
					last_name: pendingLastName,
					last_login: new Date().toISOString(),
				});
			} else {
				await touchUserLastLogin(user.id, pendingEmail, new Date().toISOString());
			}

			setOtpModalVisible(false);
			router.replace("/user/home");
		} catch (error: any) {
			const rawMessage = (error?.message || "").toLowerCase();
			if (rawMessage.includes("expired")) {
				setOtpError("Code is invalid or expired");
				return;
			}

			if (rawMessage.includes("invalid") || rawMessage.includes("token")) {
				setOtpError("Code is invalid or expired");
				return;
			}

			setOtpError(error?.message ?? "OTP verification failed");
		} finally {
			setIsVerifyingOtp(false);
		}
	};

	const handleResendOtp = async () => {
		if (resendCountdown > 0 || !pendingEmail) return;
		setOtpError("");
		try {
			await sendOtpToEmail(pendingEmail, pendingMode === "signup");
			setOtpCountdown(300);
			setResendCountdown(60);
		} catch (error: any) {
			setOtpError(error?.message ?? "Unable to resend code");
		}
	};

	useFocusEffect(
		React.useCallback(() => {
			const onBackPress = () => true;
			const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
			return () => sub.remove();
		}, [])
	);

	return (
		<LinearGradient
			colors={["#002A7A", "#1565C0"]}
        	start={{ x: 0, y: 0 }}
       	 	end={{ x: 0, y: 0.2 }}
			style={styles.gradientBackground}
		>
			<SafeAreaView style={styles.safeArea} edges={["top"]}>
				<TouchableWithoutFeedback
					onPress={() => {
						Keyboard.dismiss();
						setFocusedField(null);
						setOtpError("");
					}}
				>
				<View style={styles.container}>
				<Image source={require("../assets/images/sarina_logo.png")} style={styles.logo} resizeMode="contain" />

				<View style={styles.toggleWrap} onLayout={(e) => setToggleWidth(e.nativeEvent.layout.width)}>
					<Animated.View
						pointerEvents="none"
						style={[
							styles.togglePill,
							{
								width: Math.max(0, (toggleWidth - 8) / 2),
								transform: [
									{
										translateX: toggleAnim.interpolate({
											inputRange: [0, 1],
											outputRange: [0, Math.max(0, (toggleWidth - 8) / 2)],
										}),
									},
								],
							},
						]}
					/>
					<Pressable style={styles.toggleButton} onPress={() => handleModeChange("signup")}>
						<Text style={[styles.toggleText, mode === "signup" && styles.toggleTextActive]}>Sign Up</Text>
					</Pressable>

					<Pressable style={styles.toggleButton} onPress={() => handleModeChange("login")}>
						<Text style={[styles.toggleText, mode === "login" && styles.toggleTextActive]}>Login</Text>
					</Pressable>
				</View>

					<View style={styles.formCard}>
					<Animated.View
						style={{
							opacity: contentOpacity,
							transform: [{ translateX: contentTranslateX }],
						}}
					>
						<Text style={styles.heading}>{heading}</Text>

					{isSignup && (
						<View style={styles.inputGroup}>
							<View style={styles.nameRow}>
								<View style={styles.nameField}>
									<Text style={styles.inputLabel}>First Name</Text>
									<TextInput
										value={firstName}
										onChangeText={(value) => {
											setFirstName(value);
											if (fieldErrors.firstName) {
												setFieldErrors((prev) => ({ ...prev, firstName: undefined }));
											}
										}}
										placeholder="Enter first name"
										placeholderTextColor="#7D95C7"
										style={[
											styles.input,
											styles.nameInput,
											fieldErrors.firstName && styles.inputError,
											focusedField === 'firstName' && styles.inputFocused,
										]}
										onFocus={() => setFocusedField('firstName')}
										onBlur={() => setFocusedField(null)}
									/>
								</View>
								<View style={styles.nameField}>
									<Text style={styles.inputLabel}>Last Name</Text>
									<TextInput
										value={lastName}
										onChangeText={(value) => {
											setLastName(value);
											if (fieldErrors.lastName) {
												setFieldErrors((prev) => ({ ...prev, lastName: undefined }));
											}
										}}
										placeholder="Enter last name"
										placeholderTextColor="#7D95C7"
										style={[
											styles.input,
											styles.nameInput,
											fieldErrors.lastName && styles.inputError,
											focusedField === 'lastName' && styles.inputFocused,
										]}
										onFocus={() => setFocusedField('lastName')}
										onBlur={() => setFocusedField(null)}
									/>
								</View>
							</View>
						</View>
					)}

					<View style={styles.inputGroup}>
						<Text style={styles.inputLabel}>Email Address</Text>
						<TextInput
							value={email}
							onChangeText={(value) => {
								setEmail(value);
								if (fieldErrors.email) {
									setFieldErrors((prev) => ({ ...prev, email: undefined }));
								}
							}}
							placeholder="Enter your email address"
							placeholderTextColor="#7D95C7"
							keyboardType="email-address"
							autoCapitalize="none"
							style={[
								styles.input,
								fieldErrors.email && styles.inputError,
								focusedField === 'email' && styles.inputFocused,
							]}
							onFocus={() => setFocusedField('email')}
							onBlur={() => setFocusedField(null)}
						/>
					</View>

					<Text style={styles.otpHint}>
						A 6-digit verification code will be sent to your email.
					</Text>

					{!!authError && <Text style={styles.authError}>{authError}</Text>}

					<Pressable
						style={[styles.ctaButton, (isSwitching || isSubmitting) && styles.buttonNoShadow]}
						onPress={handleAuthSubmit}
						disabled={isSubmitting}
					>
						<LinearGradient
							colors={["#1565C0", "#002A7A"]}
							// start={{ x: 0, y: 0.5 }}
							// end={{ x: 1, y: 0.5 }}
							style={styles.ctaGradient}
						>
							{isSubmitting ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.ctaText}>{ctaLabel}</Text>}
						</LinearGradient>
					</Pressable>

					<LinearGradient
						colors={["#1565C0", "#002A7A"]}
						// start={{ x: 0, y: 0.5 }}
						// end={{ x: 1, y: 0.5 }}
						style={styles.googleWrapper}
					>
						<Pressable style={[styles.googleButton, isSwitching && styles.buttonNoShadow]}>
							<Image source={{uri: 'https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png'}} style={{width:24, height:24}} />
							<Text style={styles.googleText}>{isSignup ? "Sign up with Google" : "Login with Google"}</Text>
						</Pressable>
					</LinearGradient>

					<LinearGradient
						colors={["#FF8C5A", "#FF6B35"]}
						style={styles.quickTipCard}
					>
						<View style={styles.quickTipIconWrapper}>
							<View style={styles.quickTipIcon}>
								<Ionicons name="shield" size={25} color="#fff" />
							</View>
						</View>
						<View style={styles.quickTipTextWrap}>
							<Text style={styles.quickTipTitle}>Why OTP?</Text>
							<Text style={styles.quickTipText}>
								OTP is more secure than a password, that's it.{"\n"}
								
								Need help? <Text style={styles.quickTipEmail}>sarinapp.dev@gmail.com</Text>
							</Text>
						</View>
					</LinearGradient>
					</Animated.View>
				</View>
				</View>
				</TouchableWithoutFeedback>

				<Modal
					visible={otpModalVisible}
					transparent
					animationType="fade"
					onRequestClose={() => {
						setOtpModalVisible(false);
						setOtpError("");
					}}
				>
					<View style={styles.modalBackdrop}>
						<View style={styles.modalCard}>
							<Pressable
								style={styles.modalCloseBtn}
								onPress={() => {
									setOtpModalVisible(false);
									setOtpError("");
								}}
							>
								<Ionicons name="close" size={22} color="#0b489d" />
							</Pressable>
							<Text style={styles.modalTitle}>Enter OTP</Text>
							<Text style={styles.modalSubtitle}>
								We sent a 6-digit code to {pendingEmail}
							</Text>
							{!!otpError && <Text style={styles.modalError}>{otpError}</Text>}

							<TextInput
								value={otpCode}
								onChangeText={(value) => setOtpCode(value.replace(/[^0-9]/g, "").slice(0, 6))}
								keyboardType="number-pad"
								placeholder="000000"
								placeholderTextColor="#94A3B8"
								style={styles.otpInput}
								maxLength={6}
								textAlign="center"
							/>

							<Text style={styles.codeExpiryText}>Code expires in {formatOtpTime(otpCountdown)}</Text>

							<Pressable
								style={styles.verifyButton}
								onPress={handleVerifyOtp}
								disabled={isVerifyingOtp}
							>
								<LinearGradient colors={["#1565C0", "#002A7A"]} style={styles.verifyButtonGradient}>
										{isVerifyingOtp ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.verifyButtonText}>Verify & Continue</Text>}
								</LinearGradient>
							</Pressable>

							<Pressable onPress={handleResendOtp} disabled={resendCountdown > 0}>
								<Text style={[styles.resendText, resendCountdown > 0 && styles.resendDisabled]}>
									{resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : "Resend code"}
								</Text>
							</Pressable>
						</View>
					</View>
				</Modal>
			</SafeAreaView>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
	},
	container: {
		flex: 1,
		backgroundColor: "transparent",
		paddingHorizontal: 0,
		paddingTop: 0,
		marginRight: 0,
		marginLeft: 0,
	},
	gradientBackground: {
		flex: 1,
	},
	logo: {
		width: 170,
		height: 48,
		alignSelf: "center",
		marginBottom: 14,
		marginTop: 50,
	},
	toggleWrap: {
		height: 60,
		borderRadius: 50,
		backgroundColor: "#002a7a",
		padding: 4,
		flexDirection: "row",
		marginBottom: 16,
		marginHorizontal: 24,
		position: "relative",
		overflow: "hidden",
	},
	formCard: {
		flex: 1,
		backgroundColor: "#FFFFFF",
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		paddingHorizontal: 22,
		paddingTop: 26,
		paddingBottom: 20,
	},
	togglePill: {
		position: "absolute",
		top: 4,
		left: 4,
		bottom: 4,
		borderRadius: 50,
		backgroundColor: "#ffffff",
	},
	toggleButton: {
		flex: 1,
		borderRadius: 50,
		alignItems: "center",
		justifyContent: "center",
	},
	toggleText: {
		color: "#ffffff",
		fontSize: 18,
		fontWeight: "700",
	},
	toggleTextActive: {
		color: "#002A7A",
	},
	heading: {
		color: "#002A7A",
		fontSize: 27,
		fontWeight: "800",
		marginBottom: 20,
		textAlign: "center",
	},
	inputGroup: {
		marginBottom: 12,
	},
	nameRow: {
		flexDirection: "row",
		gap: 10,
	},
	nameField: {
		flex: 1,

	},
	nameInput: {
		width: "100%",
	},
	inputLabel: {
		color: "#002A7A",
		fontSize: 15,
		marginBottom: 7,
		fontWeight: "700",
	},
	input: {
		height: 55,
		borderRadius: 14,
		backgroundColor: "#E8ECF6",
		paddingHorizontal: 16,
		color: "#002A7A",
		fontSize: 14,
	},
	inputFocused: {
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#1565C0",
	},
	inputError: {
		borderWidth: 1,
		borderColor: "#D62828",
	},
	fieldError: {
		color: "#D62828",
		fontSize: 12,
		fontWeight: "600",
		marginTop: 4,
		marginLeft: 2,
	},
	otpHint: {
		fontSize: 13,
		color: "#64748B",
		marginBottom: 14,
		textAlign: "center",
	},
	ctaButton: {
		borderRadius: 30,
		height: 52,
		marginTop: 4,
		shadowColor: "#1E88E5",
		shadowOpacity: 0.35,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 6 },
		elevation: 4,
		overflow: "hidden",
	},
	ctaGradient: {
		flex: 1,
		borderRadius: 27,
		alignItems: "center",
		justifyContent: "center",
	},
	ctaText: {
		color: "#ffffff",
		fontSize: 20,
		fontWeight: "800",
	},
	authError: {
		color: "#D62828",
		fontSize: 13,
		fontWeight: "600",
		textAlign: "center",
		marginTop: 6,
		marginBottom: 8,
	},
	googleWrapper: {
		borderRadius: 27,
		padding: 2,
		alignSelf: "stretch",
		marginTop: 16,
	},
	googleButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#ffffff",
		borderRadius: 27,
		height: 52,
		paddingHorizontal: 16,
		shadowColor: "#00328f",
		shadowOpacity: 0.12,
		shadowRadius: 8,
		elevation: 3,
	},
	googleText: {
		color: "#002A7A",
		fontSize: 18,
		fontWeight: "700",
		marginLeft: 8,
	},
	buttonNoShadow: {
		shadowOpacity: 0,
		shadowRadius: 0,
		elevation: 0,
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(15, 23, 42, 0.45)",
		justifyContent: "center",
		paddingHorizontal: 20,
	},
	modalCard: {
		backgroundColor: "#f5f8fd",
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 14,
	},
	modalCloseBtn: {
		alignSelf: "flex-end",
		padding: 2,
	},
	modalTitle: {
		fontSize: 25,
		fontWeight: "900",
		color: "#002A7A",
		textAlign: "center",
		marginBottom: 10,
	},
	modalSubtitle: {
		fontSize: 14,
		color: "#31538f",
		textAlign: "center",
		marginBottom: 12,
	},
	modalError: {
		color: "#D62828",
		fontSize: 13,
		fontWeight: "700",
		textAlign: "center",
		marginBottom: 8,
	},
	otpInput: {
		height: 58,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "#0B489D",
		backgroundColor: "#FFFFFF",
		fontSize: 28,
		fontWeight: "700",
		letterSpacing: 10,
		color: "#64748B",
		paddingHorizontal: 14,
	},
	codeExpiryText: {
		textAlign: "center",
		marginTop: 8,
		marginBottom: 12,
		fontSize: 14,
		color: "#64748B",
	},
	verifyButton: {
		height: 50,
		borderRadius: 30,
		overflow: "hidden",
	},
	verifyButtonGradient: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	verifyButtonText: {
		color: "#FFFFFF",
		fontSize: 20,
		fontWeight: "700",
	},
	resendText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#0b489d",
		marginTop: 12,
		textAlign: "center",
	},
	resendDisabled: {
		color: "#94A3B8",
	},
	quickTipCard: {
		borderRadius: 16,
		paddingHorizontal: 14,
		paddingVertical: 15,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginTop: 18,
		marginBottom: 12,
		backgroundColor: "#FF6B35",
		shadowColor: "#FF6B35",
		shadowOpacity: 0.3,
		shadowRadius: 12,
		elevation: 5,
	},
	quickTipIconWrapper: {
		width: 42,
		height: 42,
		borderRadius: 12,
		backgroundColor: "rgba(255,255,255,0.2)",
		justifyContent: "center",
		alignItems: "center",
	},
	quickTipIcon: {
		width: 24,
		height: 24,
		justifyContent: "center",
		alignItems: "center",
	},
	quickTipTextWrap: {
		flex: 1,
	},
	quickTipTitle: {
		color: "#ffffff",
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 2,
	},
	quickTipText: {
		color: "rgba(255,255,255,0.95)",
		fontSize: 12,
		lineHeight: 18,
	},
	quickTipEmail: {
		color: "rgba(255,255,255,0.95)",
		fontSize: 12,
		fontWeight: "800",
	},
});
