export const ensureEmailColumn = (cols: string[]): string[] => {
	if (!cols.length) return ["email"];
	const filtered = cols.filter(
		(col): col is string => typeof col === "string" && col.trim().length > 0
	);
	const normalized = filtered.map((col) => col.trim().toLowerCase());
	let targetIndex = normalized.findIndex((col) => col === "email");
	if (targetIndex === -1) {
		targetIndex = normalized.findIndex((col) => col.includes("email"));
	}
	const reordered = [...filtered];
	if (targetIndex === -1) {
		reordered.push("email");
		return reordered;
	}
	if (targetIndex === reordered.length - 1) {
		return reordered;
	}
	const [emailCol] = reordered.splice(targetIndex, 1);
	reordered.push(emailCol);
	return reordered;
};