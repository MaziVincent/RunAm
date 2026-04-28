import { useEffect, useState } from "react";
import {
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSearchStore } from "@runam/shared/stores/search-store";
import { colors, radii } from "../lib/design";

type SearchSheetProps = {
	visible: boolean;
	onClose: () => void;
	onSubmit: (term: string) => void;
	suggestions?: string[];
	placeholder?: string;
};

export default function SearchSheet({
	visible,
	onClose,
	onSubmit,
	suggestions = [],
	placeholder = "Search stores, food, groceries",
}: SearchSheetProps) {
	const { recents, hydrate, addRecent, removeRecent, clearRecents } =
		useSearchStore();
	const [query, setQuery] = useState("");

	useEffect(() => {
		if (visible) {
			void hydrate();
			setQuery("");
		}
	}, [visible, hydrate]);

	const submit = (term: string) => {
		const trimmed = term.trim();
		if (!trimmed) return;
		addRecent(trimmed);
		onSubmit(trimmed);
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent
			onRequestClose={onClose}>
			<Pressable style={styles.backdrop} onPress={onClose}>
				<Pressable
					style={styles.sheet}
					onPress={(event) => event.stopPropagation()}>
					<View style={styles.handle} />
					<View style={styles.searchRow}>
						<View style={styles.inputWrap}>
							<Ionicons
								name="search-outline"
								size={18}
								color={colors.textMuted}
							/>
							<TextInput
								style={styles.input}
								placeholder={placeholder}
								placeholderTextColor={colors.textMuted}
								value={query}
								onChangeText={setQuery}
								onSubmitEditing={() => submit(query)}
								returnKeyType="search"
								autoFocus
							/>
							{query.length > 0 ? (
								<TouchableOpacity onPress={() => setQuery("")} hitSlop={8}>
									<Ionicons
										name="close-circle"
										size={18}
										color={colors.textMuted}
									/>
								</TouchableOpacity>
							) : null}
						</View>
						<TouchableOpacity onPress={onClose} hitSlop={8}>
							<Text style={styles.cancel}>Cancel</Text>
						</TouchableOpacity>
					</View>

					<ScrollView
						style={styles.body}
						contentContainerStyle={styles.bodyContent}
						keyboardShouldPersistTaps="handled">
						{recents.length > 0 ? (
							<View style={styles.section}>
								<View style={styles.sectionHeader}>
									<Text style={styles.sectionTitle}>Recent searches</Text>
									<TouchableOpacity onPress={clearRecents}>
										<Text style={styles.clearText}>Clear</Text>
									</TouchableOpacity>
								</View>
								{recents.map((term) => (
									<TouchableOpacity
										key={term}
										style={styles.row}
										onPress={() => submit(term)}
										activeOpacity={0.85}>
										<Ionicons
											name="time-outline"
											size={18}
											color={colors.textMuted}
										/>
										<Text style={styles.rowText}>{term}</Text>
										<TouchableOpacity
											onPress={() => removeRecent(term)}
											hitSlop={8}>
											<Ionicons
												name="close"
												size={18}
												color={colors.textMuted}
											/>
										</TouchableOpacity>
									</TouchableOpacity>
								))}
							</View>
						) : null}

						{suggestions.length > 0 ? (
							<View style={styles.section}>
								<Text style={styles.sectionTitle}>Popular near you</Text>
								<View style={styles.chipsRow}>
									{suggestions.map((suggestion) => (
										<TouchableOpacity
											key={suggestion}
											style={styles.chip}
											onPress={() => submit(suggestion)}
											activeOpacity={0.85}>
											<Text style={styles.chipText}>{suggestion}</Text>
										</TouchableOpacity>
									))}
								</View>
							</View>
						) : null}
					</ScrollView>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: "rgba(20, 32, 19, 0.4)",
		justifyContent: "flex-end",
	},
	sheet: {
		backgroundColor: colors.background,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		paddingTop: 12,
		paddingHorizontal: 20,
		paddingBottom: 24,
		minHeight: "60%",
		maxHeight: "92%",
	},
	handle: {
		alignSelf: "center",
		width: 38,
		height: 4,
		borderRadius: 2,
		backgroundColor: colors.border,
		marginBottom: 12,
	},
	searchRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	inputWrap: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		backgroundColor: colors.surface,
		borderRadius: radii.lg,
		paddingHorizontal: 14,
		paddingVertical: 12,
		borderWidth: 1,
		borderColor: colors.border,
	},
	input: {
		flex: 1,
		fontSize: 15,
		color: colors.textPrimary,
	},
	cancel: {
		fontSize: 14,
		fontWeight: "700",
		color: colors.brandAccent,
	},
	body: {
		marginTop: 16,
	},
	bodyContent: {
		paddingBottom: 24,
	},
	section: {
		marginBottom: 22,
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 8,
	},
	sectionTitle: {
		fontSize: 13,
		fontWeight: "800",
		color: colors.textMuted,
		letterSpacing: 1.2,
		textTransform: "uppercase",
	},
	clearText: {
		fontSize: 12,
		fontWeight: "700",
		color: colors.brandAccent,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 12,
	},
	rowText: {
		flex: 1,
		fontSize: 14,
		color: colors.textPrimary,
		fontWeight: "600",
	},
	chipsRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	chip: {
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 999,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
	},
	chipText: {
		fontSize: 13,
		fontWeight: "700",
		color: colors.brandAccent,
	},
});
