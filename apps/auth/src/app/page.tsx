"use client";

import { useState } from "react";
import { EmptyState } from "./components/empty-state";
import { LoadingState } from "./components/loading-state";
import { UserManagement } from "./components/user-management";
import type { ModalAction, User } from "./types/types";

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, _setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // TODO: Replace with actual API call
  const handleAction = (user: User, action: ModalAction) => {
    console.log(`[v0] ${action} user:`, user.id);

    // Mock action handling for now
    if (action === "suspend" || action === "activate" || action === "ban") {
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === user.id
            ? {
                ...u,
                // Note: status field doesn't exist in current User type
                // This would need to be added to the type definition
                ...u,
              }
            : u
        )
      );
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <LoadingState />;
  }

  if (users.length === 0) {
    return (
      <EmptyState
        description="Users will appear here once they register on the platform."
        title="No users found"
      />
    );
  }

  return (
    <UserManagement
      onAction={handleAction}
      onSearchChange={setSearchQuery}
      searchQuery={searchQuery}
      users={filteredUsers}
    />
  );
}
