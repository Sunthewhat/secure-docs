import { FC, useState } from "react";

type CollectionProp = {
	name: string;
};
const Collection: FC<CollectionProp> = (name) => {
	const [collection, setCollection] = useState<CollectionProp>();
	const handleCollection = () => {
		setCollection(name);
	};
	return <></>;
};
export { Collection };
