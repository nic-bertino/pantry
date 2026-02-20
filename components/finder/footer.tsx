"use client";

import Image from "next/image";

export function Footer() {
	return (
		<footer className="border-t border-border bg-background mt-8">
			<div className="container mx-auto max-w-3xl px-4 py-6">
				<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
					<Image
						src="/pantry-app.svg"
						alt=""
						width={16}
						height={16}
						className="w-4 h-4 opacity-60"
					/>
					<span>
						<a
							href="https://github.com/nic-bertino/pantry"
							target="_blank"
							rel="noopener noreferrer"
							className="underline underline-offset-2 hover:text-foreground transition-colors"
						>
							Pantry
						</a>{" "}
						is an open-source project
					</span>
				</div>
			</div>
		</footer>
	);
}
