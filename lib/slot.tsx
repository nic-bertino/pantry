import {
	Children,
	cloneElement,
	isValidElement,
	type HTMLAttributes,
	type ReactNode,
	type Ref,
} from "react";

function mergeRefs<T>(...refs: (Ref<T> | undefined | null)[]) {
	return (node: T | null) => {
		for (const ref of refs) {
			if (typeof ref === "function") ref(node);
			else if (ref != null)
				(ref as React.MutableRefObject<T | null>).current = node;
		}
	};
}

function Slot({
	children,
	ref,
	...slotProps
}: HTMLAttributes<HTMLElement> & { children?: ReactNode; ref?: Ref<HTMLElement> }) {
	const child = Children.only(children);
	if (!isValidElement(child)) return null;

	const childProps = child.props as Record<string, unknown>;
	const merged: Record<string, unknown> = { ...slotProps };

	for (const key of Object.keys(childProps)) {
		if (key === "style") {
			merged.style = {
				...(slotProps as Record<string, unknown>).style as object,
				...childProps.style as object,
			};
		} else if (key === "className") {
			merged.className = [
				(slotProps as Record<string, unknown>).className,
				childProps.className,
			]
				.filter(Boolean)
				.join(" ");
		} else if (/^on[A-Z]/.test(key)) {
			const slotHandler = (slotProps as Record<string, unknown>)[key];
			const childHandler = childProps[key];
			if (
				typeof slotHandler === "function" &&
				typeof childHandler === "function"
			) {
				merged[key] = (...args: unknown[]) => {
					(childHandler as (...a: unknown[]) => void)(...args);
					(slotHandler as (...a: unknown[]) => void)(...args);
				};
			} else {
				merged[key] = childHandler ?? slotHandler;
			}
		} else {
			merged[key] = childProps[key];
		}
	}

	const childRef = (child as { ref?: Ref<HTMLElement> }).ref;
	if (ref || childRef) {
		merged.ref = mergeRefs(ref, childRef);
	}

	return cloneElement(child, merged);
}

export { Slot };
