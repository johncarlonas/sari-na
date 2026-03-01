import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type Params = {
	location?: string;
	detail?: string;
	placeId?: string;
};

export default function NavigationScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<Params>();

	const location = typeof params.location === "string" ? params.location : "Selected location";
	const detail = typeof params.detail === "string" ? params.detail : "";

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.content}>
				<Pressable style={styles.backRow} onPress={() => router.back()}>
					<Ionicons name="chevron-back" size={24} color="#002A7A" />
					<Text style={styles.backText}>Back</Text>
				</Pressable>

				<Text style={styles.title}>Navigation</Text>
				<View style={styles.destinationCard}>
					<Text style={styles.destinationLabel}>Destination</Text>
					<Text style={styles.destinationTitle}>{location}</Text>
					{!!detail && <Text style={styles.destinationDetail}>{detail}</Text>}
				</View>

				<Pressable style={styles.doneButton} onPress={() => router.replace("/user/home") }>
					<Text style={styles.doneText}>Done</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#edf2f8",
	},
	content: {
		flex: 1,
		paddingHorizontal: 24,
		paddingTop: 100,
	},
	backRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 20,
	},
	backText: {
		color: "#002A7A",
		fontSize: 16,
		fontWeight: "700",
	},
	title: {
		color: "#002A7A",
		fontSize: 26,
		fontWeight: "900",
		marginBottom: 18,
	},
	destinationCard: {
		backgroundColor: "#fff",
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#cfdaef",
		padding: 16,
	},
	destinationLabel: {
		color: "#6b84b7",
		fontSize: 13,
		marginBottom: 6,
	},
	destinationTitle: {
		color: "#00328f",
		fontSize: 22,
		fontWeight: "900",
	},
	destinationDetail: {
		color: "#5d79ac",
		fontSize: 14,
		marginTop: 4,
	},
	doneButton: {
		marginTop: 18,
		backgroundColor: "#0b489d",
		borderRadius: 28,
		height: 52,
		alignItems: "center",
		justifyContent: "center",
	},
	doneText: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "800",
	},
});

