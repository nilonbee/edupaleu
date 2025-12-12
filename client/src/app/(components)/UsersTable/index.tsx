"use client";
import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
  GridToolbar,
} from "@mui/x-data-grid";
import {
  Box,
  TextField,
  Chip,
  InputAdornment,
  IconButton,
  Paper,
  Typography,
  Button as MuiButton,
  CircularProgress,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import {
  useGetAllUsersQuery,
  useDeleteUserMutation,
  useResendInviteEmailMutation,
  useUpdateUserMutation,
  User,
} from "@/state/userApi";
import { useAppSelector } from "@/app/redux";
import { showToast } from "@/utils/toast";
import { ActionsMenu } from "./ActionsMenu";
import { EmptyState } from "@/app/(components)/EmptyState";
import Button from "@/app/(components)/Button";

interface UsersTableProps {
  onEdit?: (id: number) => void;
  onCreate?: () => void;
}

// Agent color mapping - static colors for each agent
const getAgentColor = (userId: number): string => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-orange-500",
    "bg-teal-500",
    "bg-cyan-500",
  ];
  return colors[userId % colors.length] || "bg-gray-500";
};

export const UsersTable: React.FC<UsersTableProps> = ({ onEdit, onCreate }) => {
  const router = useRouter();
  const currentUser = useAppSelector((state) => state.auth.user);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  });

  // API queries
  const {
    data: usersResponse,
    isLoading,
    error,
    refetch,
  } = useGetAllUsersQuery({
    search: searchTerm || undefined,
    role: (() => {
      const roleFilterItem = filterModel.items?.find(
        (item: any) => item.field === "role"
      );
      return roleFilterItem?.value || undefined;
    })(),
    isActive: (() => {
      const statusFilterItem = filterModel.items?.find(
        (item: any) => item.field === "isActive"
      );
      if (statusFilterItem?.value === "true") return "true";
      if (statusFilterItem?.value === "false") return "false";
      return undefined;
    })(),
  });

  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [resendInviteEmail, { isLoading: isResendingInvite }] =
    useResendInviteEmailMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const users = useMemo(() => {
    if (!usersResponse) return [];
    return usersResponse.data || [];
  }, [usersResponse]);

  // Role color helper
  const getRoleColor = useCallback((role: string) => {
    const roleUpper = role.toUpperCase();
    if (roleUpper === "ADMIN") return "error";
    if (roleUpper === "AGENT") return "info";
    return "default";
  }, []);

  // Handlers
  const handleView = useCallback(
    (id: number) => {
      router.push(`/users/${id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (id: number) => {
      if (onEdit) {
        onEdit(id);
      } else {
        router.push(`/users/${id}/edit`);
      }
    },
    [router, onEdit]
  );

  const handleDelete = useCallback(
    async (id: number, email: string) => {
      if (currentUser?.userId === id) {
        showToast.error("You cannot delete your own account");
        return;
      }

      if (
        !confirm(
          `Are you sure you want to delete user ${email}? This action cannot be undone.`
        )
      ) {
        return;
      }

      try {
        await deleteUser(id).unwrap();
        showToast.success("User deleted successfully");
        refetch();
      } catch (error: any) {
        const errorMessage =
          error?.data?.message ||
          error?.message ||
          "Failed to delete user. Please try again.";
        showToast.error(errorMessage);
      }
    },
    [deleteUser, refetch, currentUser]
  );

  const handleResendInvite = useCallback(
    async (id: number, email: string) => {
      if (!confirm(`Resend invite email to ${email}?`)) {
        return;
      }

      try {
        await resendInviteEmail(id).unwrap();
        showToast.success("Invite email sent successfully");
      } catch (error: any) {
        const errorMessage =
          error?.data?.message ||
          error?.message ||
          "Failed to send invite email. Please try again.";
        showToast.error(errorMessage);
      }
    },
    [resendInviteEmail]
  );

  const handleToggleActive = useCallback(
    async (user: User) => {
      const action = user.isActive ? "deactivate" : "activate";
      const actionPast = user.isActive ? "deactivated" : "activated";
      
      if (
        !confirm(
          `Are you sure you want to ${action} ${user.email}?`
        )
      ) {
        return;
      }

      try {
        await updateUser({
          id: user.id,
          data: {
            isActive: !user.isActive,
          },
        }).unwrap();
        showToast.success(`User ${actionPast} successfully`);
        refetch();
      } catch (error: any) {
        const errorMessage =
          error?.data?.message ||
          error?.message ||
          `Failed to ${action} user. Please try again.`;
        showToast.error(errorMessage);
      }
    },
    [updateUser, refetch]
  );

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(event.target.value);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    },
    []
  );

  // Column definitions
  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 80,
        flex: 0,
        filterable: true,
      },
      {
        field: "name",
        headerName: "Name",
        width: 200,
        flex: 1,
        filterable: true,
        valueGetter: (value, row: User) => {
          return `${row.firstName} ${row.lastName}`.trim();
        },
      },
      {
        field: "email",
        headerName: "Email",
        width: 250,
        flex: 1,
        filterable: true,
      },
      {
        field: "phone",
        headerName: "Phone",
        width: 150,
        flex: 0,
        filterable: true,
        valueGetter: (value, row: User) => {
          return row.phone || "N/A";
        },
      },
      {
        field: "role",
        headerName: "Role",
        width: 120,
        flex: 0,
        filterable: true,
        type: "singleSelect",
        valueOptions: [
          { value: "admin", label: "Admin" },
          { value: "agent", label: "Agent" },
          { value: "user", label: "User" },
        ],
        renderCell: (params) => {
          const role = params.value as string;
          const formattedRole =
            role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
          return (
            <Chip
              label={formattedRole}
              color={getRoleColor(role)}
              size="small"
              variant="outlined"
            />
          );
        },
      },
      {
        field: "isActive",
        headerName: "Status",
        width: 100,
        flex: 0,
        filterable: true,
        type: "singleSelect",
        valueOptions: [
          { value: "true", label: "Active" },
          { value: "false", label: "Inactive" },
        ],
        valueGetter: (value, row: User) => {
          return row.isActive ? "true" : "false";
        },
        renderCell: (params) => {
          const isActive = params.value === "true";
          return (
            <Chip
              label={isActive ? "Active" : "Inactive"}
              color={isActive ? "success" : "default"}
              size="small"
              variant="outlined"
            />
          );
        },
      },
      {
        field: "lastLogin",
        headerName: "Last Login",
        width: 150,
        flex: 0,
        filterable: true,
        type: "date",
        valueGetter: (value, row: User) => {
          if (!row.lastLogin) return null;
          return new Date(row.lastLogin);
        },
        renderCell: (params) => {
          if (!params.value) return "Never";
          return params.value.toLocaleDateString();
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 80,
        flex: 0,
        sortable: false,
        filterable: false,
        disableColumnFilter: true,
        renderCell: (params) => {
          const user = params.row as User;
          return (
            <ActionsMenu
              userId={user.id}
              user={user}
              currentUserId={currentUser?.userId}
              currentUserRole={currentUser?.role}
              onView={() => handleView(user.id)}
              onEdit={() => handleEdit(user.id)}
              onDelete={() => handleDelete(user.id, user.email)}
              onResendInvite={() => handleResendInvite(user.id, user.email)}
              onToggleActive={() => handleToggleActive(user)}
            />
          );
        },
      },
    ],
    [handleView, handleEdit, handleDelete, handleResendInvite, handleToggleActive, getRoleColor, currentUser]
  );

  // Loading state
  if (isLoading && !users.length) {
    return (
      <Paper className="p-6">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={400}
        >
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  // Error state
  if (error) {
    return (
      <Paper className="p-6">
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="error" gutterBottom>
            Error loading users
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {error && "data" in error
              ? String(error.data)
              : "An unexpected error occurred"}
          </Typography>
          <MuiButton
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            className="mt-4"
          >
            Retry
          </MuiButton>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper className="shadow-sm">
      {/* Header with Filters */}
      <Box className="p-4 border-b border-gray-200">
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h6" className="font-semibold">
            Users
          </Typography>
          <Box display="flex" gap={2}>
            <MuiButton
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
              size="small"
            >
              Refresh
            </MuiButton>
            {currentUser?.role === "admin" && (
              <Button
                variant="primary"
                size="md"
                onClick={onCreate}
                className="flex items-center"
              >
                <AddIcon className="w-4 h-4 mr-2" />
                Create User
              </Button>
            )}
          </Box>
        </Box>

        {/* Search and Filter Controls */}
        <Box display="flex" gap={2} flexWrap="wrap">
          {/* Global Search */}
          <TextField
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearchChange}
            size="small"
            className="flex-1 min-w-[250px]"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon className="text-gray-400" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleClearSearch}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      {/* DataGrid */}
      <Box>
        <DataGrid
          rows={users}
          columns={columns}
          getRowId={(row) => row.id}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          filterModel={filterModel}
          onFilterModelChange={(newModel) => {
            setFilterModel(newModel);
            setPaginationModel((prev) => ({ ...prev, page: 0 }));
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          loading={isLoading}
          disableRowSelectionOnClick
          className="border-0"
          sx={{
            "& .MuiDataGrid-cell:focus": {
              outline: "none",
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.04)",
            },
          }}
          filterMode="client"
          slots={{
            toolbar: GridToolbar,
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: false,
            },
          }}
          initialState={{
            filter: {
              filterModel: {
                items: [],
              },
            },
          }}
        />
      </Box>

      {/* Empty State */}
      {!isLoading && users.length === 0 && (
        <EmptyState
          title="No users found"
          message={
            searchTerm || filterModel.items?.length > 0
              ? "Try adjusting your search or filter criteria to find users."
              : "Get started by creating your first user."
          }
          actionLabel={
            !searchTerm &&
            (!filterModel.items || filterModel.items.length === 0) &&
            currentUser?.role === "admin" &&
            onCreate
              ? "Create User"
              : undefined
          }
          onAction={
            !searchTerm &&
            (!filterModel.items || filterModel.items.length === 0) &&
            currentUser?.role === "admin" &&
            onCreate
              ? onCreate
              : undefined
          }
        />
      )}
    </Paper>
  );
};
