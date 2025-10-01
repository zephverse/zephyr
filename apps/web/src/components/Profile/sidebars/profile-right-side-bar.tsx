"use client";

import type { UserData } from "@zephyr/db";
import type React from "react";
import ContributeCard from "@/components/misc/ContributionCard";
import UserDetails from "@/components/Profile/sidebars/right/UserDetails";

type ProfileRightSideBarProps = {
	username: string;
	userData: UserData;
	loggedInUserId: string;
};

const ProfileRightSideBar: React.FC<ProfileRightSideBarProps> = ({
	userData,
	loggedInUserId,
}) => (
	<aside className="w-96 shrink-0 overflow-y-auto bg-[hsl(var(--background-alt))] p-4 text-card-foreground">
		<div className="space-y-4">
			<UserDetails loggedInUserId={loggedInUserId} userData={userData} />
			<ContributeCard isCollapsed={false} />
		</div>
	</aside>
);

export default ProfileRightSideBar;
