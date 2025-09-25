import type { ReactNode } from "react";

type EmptyStateProps = {
	title: string;
	description?: string;
	icon?: ReactNode;
	className?: string;
};

const DefaultEmptyIcon = () => (
	<svg
		className="w-10 h-10"
		viewBox="0 0 24 24"
		fill="none"
		aria-hidden="true"
	>
		<path
			d="M7 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V9.828a3 3 0 0 0-.879-2.121l-3.828-3.828A3 3 0 0 0 13.172 3H7Zm5 2h1.172a1 1 0 0 1 .707.293l3.828 3.828A1 1 0 0 1 18 9.828V18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5Zm-1 9H9a1 1 0 1 0 0 2h2v2a1 1 0 1 0 2 0v-2h2a1 1 0 1 0 0-2h-2v-2a1 1 0 1 0-2 0v2Z"
			fill="currentColor"
		/>
	</svg>
);

const EmptyState = ({
	title,
	description,
	icon,
	className = "",
}: EmptyStateProps) => (
	<div
		className={`flex flex-col items-center justify-center text-center gap-3 py-12 text-gray-500 ${className}`.trim()}
	>
		<div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
			{icon ?? <DefaultEmptyIcon />}
		</div>
		<p className="text-sm font-medium">{title}</p>
		{description ? (
			<p className="text-xs text-gray-400 max-w-xs">{description}</p>
		) : null}
	</div>
);

export { EmptyState };
