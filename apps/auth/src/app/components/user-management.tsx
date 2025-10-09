"use client";

import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { ModalAction, User } from "../types/types";
import { ActionModal } from "./action-modal";
import { UserTable } from "./user-table";

type UserManagementProps = {
  users: User[];
  onAction: (user: User, action: ModalAction) => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
};

export function UserManagement({
  users,
  onAction,
  onSearchChange,
  searchQuery,
}: UserManagementProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalAction, setModalAction] = useState<ModalAction | null>(null);

  const handleAction = (user: User, action: ModalAction) => {
    setSelectedUser(user);
    setModalAction(action);
  };

  const handleConfirm = () => {
    if (selectedUser && modalAction) {
      onAction(selectedUser, modalAction);
      setSelectedUser(null);
      setModalAction(null);
    }
  };

  const handleCancel = () => {
    setSelectedUser(null);
    setModalAction(null);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <main className="flex-1 overflow-y-auto">
        <UserTable
          onAction={handleAction}
          onSearchChange={onSearchChange}
          searchQuery={searchQuery}
          users={users}
        />
      </main>

      {/* Action Modal */}
      <AnimatePresence>
        {modalAction && selectedUser && (
          <ActionModal
            action={modalAction}
            onCancel={handleCancel}
            onConfirm={handleConfirm}
            user={selectedUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
