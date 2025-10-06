// Extend fabric.Object to include custom properties
declare module "fabric" {
	interface FabricObject {
		id?: string;
		dbField?: string;
		isAnchor?: boolean;
		isQRanchor?: boolean;
		undeleteable?: boolean;
	}
}

export type MenuType = "background" | "element" | "image" | "text" | "anchor" | "signature" | null;
