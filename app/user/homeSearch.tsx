import React, { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
	Keyboard,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import places from "../data/places";

type Place = {
	id: string;
	title: string;
	subtitle: string;
	coords: [number, number];
};

export default function HomeSearchScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [searchText, setSearchText] = useState("");
	const [searchFocused, setSearchFocused] = useState(false);
	const containerBorder = searchFocused ? "#002A7A" : "#cfdaef";

	const results = useMemo(() => {
		const query = searchText.trim().toLowerCase();
		if (!query) return [] as Place[];

		const source = places as Place[];

		const startsWithTitle = source.filter((place) => place.title.toLowerCase().startsWith(query));

		const startsWithWord = source.filter((place) => {
			if (startsWithTitle.some((entry) => entry.id === place.id)) return false;
			return place.title
				.toLowerCase()
				.split(/\s+/)
				.some((word) => word.startsWith(query));
		});

		const containsQuery = source.filter((place) => {
			if (startsWithTitle.some((entry) => entry.id === place.id)) return false;
			if (startsWithWord.some((entry) => entry.id === place.id)) return false;
			return (
				place.title.toLowerCase().includes(query) ||
				place.subtitle.toLowerCase().includes(query)
			);
		});

		return [...startsWithTitle, ...startsWithWord, ...containsQuery];
	}, [searchText]);

	const hasQuery = searchText.trim().length > 0;

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView
				contentContainerStyle={[styles.content, { paddingBottom: 90 + insets.bottom }]}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
				onScrollBeginDrag={() => Keyboard.dismiss()}
			>
					<View style={styles.headerRow}>
						<Pressable
							style={styles.backButton}
							onPress={() => {
								setSearchText("");
								setSearchFocused(false);
								Keyboard.dismiss();
								router.replace("/user/home");
							}}
						>
							<Ionicons name="chevron-back" size={24} color="#002A7A" />
						</Pressable>
						<Text style={styles.greeting}>Navigate</Text>
					</View>

					<View style={[styles.searchContainer, { borderColor: containerBorder }]}>
						<TextInput
							value={searchText}
							onChangeText={setSearchText}
							placeholder="Search for a location"
							placeholderTextColor="#8ca0c7"
							style={styles.searchInput}
							onFocus={() => setSearchFocused(true)}
							onBlur={() => setSearchFocused(false)}
							autoFocus
						/>
						<View style={styles.searchIconWrapper}>
							<Ionicons name="search" size={25} color="#fff" style={{ marginRight: 5 }} />
						</View>
					</View>

					{!hasQuery && (
						<View style={styles.emptyWrap}>
							<View style={styles.emptyIconCircle}>
								<Ionicons name="search" size={38} color="#2a80d8" />
							</View>
							<Text style={styles.emptyTitle}>Search for a location</Text>
							<Text style={styles.emptyText}>Enter a location name or address to find it</Text>
						</View>
					)}

					{hasQuery && (
						<View>
							<Text style={styles.sectionTitle}>Search Results</Text>
							{results.map((item) => (
								<Pressable
									key={item.id}
									onPress={() =>
										router.push({
											pathname: "/user/navigation",
											params: {
												placeId: item.id,
												location: item.title,
												detail: item.subtitle,
											},
										})
									}
									style={styles.resultCard}
								>
									<View style={styles.resultIconWrap}>
										<MaterialCommunityIcons name="map-marker" size={23} color="#6d7da4" />
									</View>
									<View style={styles.resultTextWrap}>
										<Text style={styles.resultTitle}>{item.title}</Text>
										<Text style={styles.resultSubtitle} numberOfLines={1}>
											{item.subtitle}
										</Text>
									</View>
									<Ionicons name="chevron-forward" size={22} color="#9ab0d6" />
								</Pressable>
							))}
						</View>
					)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: "#edf2f8" },
	content: {
		paddingHorizontal: 14,
		paddingTop: 100,
		marginLeft: 10,
		marginRight: 10,
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 18,
	},
	backButton: {
		marginRight: 6,
		paddingRight: 2,
	},
	greeting: {
		color: "#002a7a",
		fontSize: 25,
		fontWeight: "900",
	},
	searchContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#fff",
		borderRadius: 30,
		height: 55,
		paddingHorizontal: 10,
		marginBottom: 18,
		borderWidth: 1,
		borderColor: "#cfdaef",
		shadowColor: "#8ea8d5",
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 3,
		position: "relative",
	},
	searchInput: {
		flex: 1,
		color: "#00328f",
		fontSize: 14,
		paddingVertical: 0,
		paddingLeft: 10,
		paddingRight: 50,
	},
	searchIconWrapper: {
		position: "absolute",
		right: 0,
		top: 0,
		bottom: 0,
		width: 55,
		backgroundColor: "#0b489d",
		borderTopRightRadius: 30,
		borderBottomRightRadius: 30,
		alignItems: "center",
		justifyContent: "center",
	},
	emptyWrap: {
		alignItems: "center",
		justifyContent: "center",
		marginTop: 80,
	},
	emptyIconCircle: {
		width: 88,
		height: 88,
		borderRadius: 44,
		backgroundColor: "#dbe7f6",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 16,
	},
	emptyTitle: {
		color: "#002a7a",
		fontSize: 18,
		fontWeight: "800",
		marginBottom: 8,
	},
	emptyText: {
		color: "#5d79ac",
		fontSize: 14,
		textAlign: "center",
	},
	sectionTitle: {
		color: "#00328f",
		fontSize: 18,
		fontWeight: "900",
		marginBottom: 12,
	},
	resultCard: {
		borderWidth: 1,
		borderColor: "#cfdaf0",
		borderRadius: 16,
		paddingHorizontal: 14,
		minHeight: 88,
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 10,
		backgroundColor: "#f7f9fd",
	},
	resultIconWrap: {
		width: 42,
		height: 42,
		borderRadius: 12,
		backgroundColor: "#cfdaf0",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	resultTextWrap: {
		flex: 1,
		marginRight: 10,
	},
	resultTitle: {
		color: "#00328f",
		fontSize: 16,
		fontWeight: "900",
		marginBottom: 3,
	},
	resultSubtitle: {
		color: "#6b84b7",
		fontSize: 14,
	},
});

