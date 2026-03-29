"use client";

import { XIcon } from "lucide-react";
import { Drawer as DrawerPrimitive } from "@base-ui/react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Drawer({ ...props }: DrawerPrimitive.Root.Props) {
	return <DrawerPrimitive.Root {...props} />;
}

function DrawerTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
	return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerClose({ ...props }: DrawerPrimitive.Close.Props) {
	return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerPortal({ ...props }: DrawerPrimitive.Portal.Props) {
	return <DrawerPrimitive.Portal {...props} />;
}

function DrawerBackdrop({
	className,
	...props
}: DrawerPrimitive.Backdrop.Props) {
	return (
		<DrawerPrimitive.Backdrop
			data-slot="drawer-backdrop"
			className={cn(
				"bg-black/80 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 z-50 transition-opacity duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0",
				className,
			)}
			{...props}
		/>
	);
}

function DrawerContent({
	className,
	children,
	showCloseButton = false,
	...props
}: DrawerPrimitive.Popup.Props & {
	showCloseButton?: boolean;
}) {
	return (
		<DrawerPortal>
			<DrawerBackdrop />
			<DrawerPrimitive.Viewport className="fixed inset-0 z-50 flex items-end">
				<DrawerPrimitive.Popup
					data-slot="drawer-content"
					className={cn(
						"bg-background w-full rounded-t-2xl shadow-lg flex flex-col text-sm max-h-[85vh] outline-none transition-transform duration-200 data-starting-style:translate-y-full data-ending-style:translate-y-full",
						className,
					)}
					{...props}
				>
					{/* Drag handle indicator */}
					<div className="mx-auto mt-3 mb-1 h-1 w-10 shrink-0 rounded-full bg-border" />
					<DrawerPrimitive.Content className="overflow-y-auto flex-1">
						{children}
					</DrawerPrimitive.Content>
					{showCloseButton && (
						<DrawerPrimitive.Close
							data-slot="drawer-close"
							render={
								<Button
									variant="ghost"
									className="absolute top-4 right-4"
									size="icon-sm"
								/>
							}
						>
							<XIcon />
							<span className="sr-only">Close</span>
						</DrawerPrimitive.Close>
					)}
				</DrawerPrimitive.Popup>
			</DrawerPrimitive.Viewport>
		</DrawerPortal>
	);
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="drawer-header"
			className={cn("gap-1.5 px-6 pt-4 pb-2 flex flex-col", className)}
			{...props}
		/>
	);
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="drawer-footer"
			className={cn("gap-2 p-6 mt-auto flex flex-col", className)}
			{...props}
		/>
	);
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
	return (
		<DrawerPrimitive.Title
			data-slot="drawer-title"
			className={cn("text-foreground text-base font-medium", className)}
			{...props}
		/>
	);
}

function DrawerDescription({
	className,
	...props
}: DrawerPrimitive.Description.Props) {
	return (
		<DrawerPrimitive.Description
			data-slot="drawer-description"
			className={cn("text-muted-foreground text-sm", className)}
			{...props}
		/>
	);
}

export {
	Drawer,
	DrawerTrigger,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerFooter,
	DrawerTitle,
	DrawerDescription,
};
