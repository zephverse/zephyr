"use client";

import { AnimatePresence } from "motion/react";
import { useState } from "react";
import type { ModalAction, User, UserFilters } from "../types/types";
import { ActionModal } from "./action-modal";
import { UserTable } from "./user-table";
import { UserUpdateModal } from "./user-update-modal";

type UserManagementProps = {
  users: User[];
  onAction: (user: User, action: ModalAction) => void;
  onSearchChangeAction: (query: string) => void;
  searchQuery: string;
  totalCount?: number;
  hasMore?: boolean;
  onLoadMoreAction?: () => void;
  filters?: UserFilters;
  onFiltersChangeAction?: (filters: UserFilters) => void;
  sortBy?: "createdAt" | "aura" | "username" | "displayName";
  sortOrder?: "asc" | "desc";
  onSortChangeAction?: (
    sortBy: "createdAt" | "aura" | "username" | "displayName",
    sortOrder: "asc" | "desc"
  ) => void;
};

export function UserManagement({
  users,
  onAction,
  onSearchChangeAction,
  searchQuery,
  totalCount,
  hasMore,
  onLoadMoreAction,
  filters,
  onFiltersChangeAction,
  sortBy,
  sortOrder,
  onSortChangeAction,
}: UserManagementProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalAction, setModalAction] = useState<ModalAction | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const handleAction = (user: User, action: ModalAction) => {
    if (action === "update") {
      setSelectedUser(user);
      setShowUpdateModal(true);
    } else {
      setSelectedUser(user);
      setModalAction(action);
    }
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

  const handleUpdateSuccess = () => {
    setShowUpdateModal(false);
    setSelectedUser(null);
    if (selectedUser) {
      onAction(selectedUser, "update");
    }
  };

  const handleUpdateClose = () => {
    setShowUpdateModal(false);
    setSelectedUser(null);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <main className="custom-scrollbar flex-1 overflow-y-auto">
        <UserTable
          filters={filters}
          hasMore={hasMore}
          onAction={handleAction}
          onFiltersChangeAction={onFiltersChangeAction}
          onLoadMoreAction={onLoadMoreAction}
          onSearchChangeAction={onSearchChangeAction}
          onSortChangeAction={onSortChangeAction}
          searchQuery={searchQuery}
          sortBy={sortBy}
          sortOrder={sortOrder}
          totalCount={totalCount}
          users={users}
        />
      </main>

      <AnimatePresence>
        {modalAction && selectedUser && (
          <ActionModal
            action={modalAction}
            onCancelAction={handleCancel}
            onConfirmAction={handleConfirm}
            user={selectedUser}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUpdateModal && selectedUser && (
          <UserUpdateModal
            onCloseAction={handleUpdateClose}
            onSuccessAction={handleUpdateSuccess}
            user={selectedUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
