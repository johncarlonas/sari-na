import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
	Animated,
	BackHandler,
	Easing,
	Image,
	Keyboard,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, Ionicons, Entypo } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

type AuthMode = "signup" | "login";

export default function LoginSignupScreen() {
	const router = useRouter();
	const [mode, setMode] = useState<AuthMode>("signup");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [rememberMe, setRememberMe] = useState(false);
	const [toggleWidth, setToggleWidth] = useState(0);
	const [focusedField, setFocusedField] = useState<"firstName"|"lastName"|"email"|"password"|null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const [isSwitching, setIsSwitching] = useState(false);

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
										onChangeText={setFirstName}
										placeholder="Enter first name"
										placeholderTextColor="#7D95C7"
										style={[
											styles.input,
											styles.nameInput,
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
										onChangeText={setLastName}
										placeholder="Enter last name"
										placeholderTextColor="#7D95C7"
										style={[
											styles.input,
											styles.nameInput,
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
							onChangeText={setEmail}
							placeholder="Enter your email address"
							placeholderTextColor="#7D95C7"
							keyboardType="email-address"
							autoCapitalize="none"
							style={[
								styles.input,
								focusedField === 'email' && styles.inputFocused,
							]}
							onFocus={() => setFocusedField('email')}
							onBlur={() => setFocusedField(null)}
						/>
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.inputLabel}>Password</Text>
						<View
							style={[
								styles.passwordWrap,
								focusedField === 'password' && styles.passwordWrapFocused,
							]}
						>
							<TextInput
								value={password}
								onChangeText={setPassword}
								placeholder="Enter your password"
								placeholderTextColor="#7D95C7"
								secureTextEntry={!showPassword}
								style={styles.passwordInput}
								onFocus={() => setFocusedField('password')}
								onBlur={() => setFocusedField(null)}
							/>
							<Pressable onPress={() => setShowPassword(p => !p)} style={styles.eyeButton} hitSlop={8}>
								<Ionicons name={showPassword ? 'eye' : 'eye-off'} size={25} color="#0b489d" />
							</Pressable>
						</View>
					</View>

					<View style={styles.metaRow}>
						<Pressable style={styles.rememberWrap} onPress={() => setRememberMe((prev) => !prev)}>
							<View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
								{rememberMe && <Entypo name="check" size={13} color="#FFFFFF" />}
							</View>
							<Text style={styles.rememberText}>Remember Me</Text>
						</Pressable>

						<Pressable>
							<Text style={styles.forgotText}>Forgot Password?</Text>
						</Pressable>
					</View>

					<Pressable style={[styles.ctaButton, isSwitching && styles.buttonNoShadow]} onPress={() => router.replace('/user/home')}>
						<LinearGradient
							colors={["#1565C0", "#002A7A"]}
							// start={{ x: 0, y: 0.5 }}
							// end={{ x: 1, y: 0.5 }}
							style={styles.ctaGradient}
						>
							<Text style={styles.ctaText}>{ctaLabel}</Text>
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
					</Animated.View>
				</View>
				</View>
				</TouchableWithoutFeedback>
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
	passwordWrap: {
		height: 55,
		borderRadius: 14,
		backgroundColor: "#E8ECF6",
		flexDirection: 'row',
		alignItems: 'center',
		paddingRight: 12,
	},
	passwordWrapFocused: {
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#002A7A",
	},
	passwordInput: {
		flex: 1,
		height: "100%",
		paddingHorizontal: 16,
		color: "#002A7A",
		fontSize: 14,
	},
	eyeButton: {
		width: 30,
		height: 30,
		alignItems: 'center',
		justifyContent: 'center',
	},
	inputFocused: {
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#1565C0",
	},
	metaRow: {
		marginTop: 2,
		marginBottom: 14,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	rememberWrap: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	checkbox: {
		width: 18,
		height: 18,
		borderRadius: 3,
		borderWidth: 2,
		borderColor: "#0b489d",
		alignItems: "center",
		justifyContent: "center",
	},
	checkboxChecked: {
		backgroundColor: "#0b489d",
		borderColor: "#0b489d",
	},
	rememberText: {
		color: "#002a7a",
		fontSize: 15,
		fontWeight: "700",
	},
	forgotText: {
		color: "#1565C0",
		fontSize: 14,
		fontWeight: "600",
	},
	ctaButton: {
		borderRadius: 30,
		height: 52,
		marginTop: 15,
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
});
