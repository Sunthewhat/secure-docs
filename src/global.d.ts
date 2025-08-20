import { FabricObject } from "fabric";

declare module "fabric" {
	// to have the properties recognized on the instance and in the constructor
	interface FabricObject {
		id?: string;
		name?: string;
		dbField?: string;
		isAnchor?: boolean;
	}
	// to have the properties typed in the exported object
	interface SerializedObjectProps {
		id?: string;
		name?: string;
		dbField?: string;
		isAnchor?: boolean;
	}
}

// to actually have the properties added to the serialized object
FabricObject.customProperties = ["name", "id", "dbField", "isAnchor"];
