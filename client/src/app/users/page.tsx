"use client";
import React, { useState } from "react";
import { UsersTable } from "@/app/(components)/UsersTable";
import { CreateUserModal } from "@/app/(components)/UsersTable/CreateUserModal";
import { EditUserModal } from "@/app/(components)/UsersTable/EditUserModal";
import { useAppSelector } from "@/app/redux";

const UsersPage = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleEdit = (id: number) => {
    setEditingUserId(id);
  };

  const handleCloseCreate = () => {
    setIsCreateModalOpen(false);
  };

  const handleCloseEdit = () => {
    setEditingUserId(null);
  };

  // Only admin and agent can access this page
  if (currentUser?.role !== "admin" && currentUser?.role !== "agent") {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600">
          You don&apos;t have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-gray-600 mt-1">
          Manage users, roles, and permissions
        </p>
      </div>

      <UsersTable onCreate={handleCreate} onEdit={handleEdit} />

      {isCreateModalOpen && (
        <CreateUserModal open={isCreateModalOpen} onClose={handleCloseCreate} />
      )}

      {editingUserId && (
        <EditUserModal
          open={!!editingUserId}
          userId={editingUserId}
          onClose={handleCloseEdit}
        />
      )}
    </>
  );
};

export default UsersPage;
