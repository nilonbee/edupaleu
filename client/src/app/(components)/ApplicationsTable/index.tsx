"use client";
import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/app/redux";
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
  CircularProgress,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  useGetApplicationsQuery,
  useDeleteApplicationMutation,
  useUpdateApplicationStatusMutation,
  useUpdateApplicationAssignedToMutation,
  useUpdateApplicationAssignedAgentMutation,
  useUpdateApplicationRegisteredMutation,
  GetApplicationsParams,
  ApplicationsResponse,
} from "@/state/applicationApi";
import { Application, ApplicationStatus } from "@/state/api";
import { useGetApplicationStatusesQuery } from "@/state/api";
import { useGetAllUsersQuery } from "@/state/userApi";
import { useGetCountriesQuery } from "@/state/enquiryApi";
import { showToast } from "@/utils/toast";
import { ActionsMenu } from "./ActionsMenu";
import { StatusChangeModal } from "./StatusChangeModal";
import { UserChangeModal } from "./UserChangeModal";
import { RegisteredChangeModal } from "./RegisteredChangeModal";
import { EmptyState } from "@/app/(components)/EmptyState";
import Button from "@/app/(components)/Button";

interface ApplicationsTableProps {
  onEdit?: (id: number) => void;
}

interface StatusChangeModalState {
  open: boolean;
  applicationId: number | null;
  applicationRef: string;
  currentStatus?: string;
  currentRegistered?: boolean;
}

interface UserChangeModalState {
  open: boolean;
  applicationId: number | null;
  applicationRef: string;
  fieldType: "assignedTo" | "assignedAgent";
  currentUser?: any;
}

interface RegisteredChangeModalState {
  open: boolean;
  applicationId: number | null;
  applicationRef: string;
  currentRegistered?: boolean;
}

export const ApplicationsTable: React.FC<ApplicationsTableProps> = ({
  onEdit,
}) => {
  const router = useRouter();
  const currentUser = useAppSelector((state) => state.auth.user);
  const isAdmin = currentUser?.role === "admin";

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "updatedAt", sort: "desc" },
  ]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  });

  // Status change modal state
  const [statusModal, setStatusModal] = useState<StatusChangeModalState>({
    open: false,
    applicationId: null,
    applicationRef: "",
    currentStatus: undefined,
  });

  // User change modal state
  const [userModal, setUserModal] = useState<UserChangeModalState>({
    open: false,
    applicationId: null,
    applicationRef: "",
    fieldType: "assignedTo",
    currentUser: undefined,
  });

  // Registered change modal state
  const [registeredModal, setRegisteredModal] =
    useState<RegisteredChangeModalState>({
      open: false,
      applicationId: null,
      applicationRef: "",
      currentRegistered: false,
    });

  // Build query parameters
  const queryParams: GetApplicationsParams = useMemo(() => {
    const params: GetApplicationsParams = {
      page: paginationModel.pageSize === -1 ? 1 : paginationModel.page + 1, // Backend uses 1-based pagination
      limit: paginationModel.pageSize === -1 ? 10000 : paginationModel.pageSize,
    };

    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }

    // Extract status filter from DataGrid filterModel
    const statusFilterItem = filterModel.items?.find(
      (item: any) => item.field === "status"
    );
    if (statusFilterItem && statusFilterItem.value) {
      // Handle both single value and array of values
      const statusValue = Array.isArray(statusFilterItem.value)
        ? statusFilterItem.value.join(",")
        : statusFilterItem.value;
      if (statusValue) {
        params.status = statusValue;
      }
    }

    // Extract country filter from DataGrid filterModel
    const countryFilterItem = filterModel.items?.find(
      (item: any) => item.field === "country"
    );
    if (countryFilterItem && countryFilterItem.value) {
      const countryValue = countryFilterItem.value;
      if (typeof countryValue === "number") {
        params.countryId = countryValue;
      } else if (
        typeof countryValue === "string" &&
        !isNaN(parseInt(countryValue, 10))
      ) {
        params.countryId = parseInt(countryValue, 10);
      }
    }

    if (sortModel.length > 0) {
      const sort = sortModel[0];
      params.sort_by = sort.field;
      params.order = sort.sort === "asc" ? "asc" : "desc";
    }

    return params;
  }, [searchTerm, filterModel, paginationModel, sortModel]);

  // API queries
  const {
    data: applicationsResponse,
    isLoading,
    error,
    refetch,
  } = useGetApplicationsQuery(queryParams);

  const { data: availableStatuses = [] } = useGetApplicationStatusesQuery();
  const { data: usersResponse } = useGetAllUsersQuery();
  const { data: countriesResponse } = useGetCountriesQuery();
  const countries = useMemo(
    () => countriesResponse?.data || [],
    [countriesResponse]
  );

  const [deleteApplication, { isLoading: isDeleting }] =
    useDeleteApplicationMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateApplicationStatusMutation();
  const [updateAssignedTo, { isLoading: isUpdatingAssignedTo }] =
    useUpdateApplicationAssignedToMutation();
  const [updateAssignedAgent, { isLoading: isUpdatingAssignedAgent }] =
    useUpdateApplicationAssignedAgentMutation();
  const [updateRegistered, { isLoading: isUpdatingRegistered }] =
    useUpdateApplicationRegisteredMutation();

  const availableUsers = useMemo(() => {
    return usersResponse?.data || [];
  }, [usersResponse]);

  // Extract applications and pagination from response
  const applications = useMemo(() => {
    if (!applicationsResponse) return [];

    // Handle both old array format and new response format
    if (Array.isArray(applicationsResponse)) {
      return applicationsResponse;
    }

    if ("data" in applicationsResponse) {
      return applicationsResponse.data || [];
    }

    return [];
  }, [applicationsResponse]);

  const pagination = useMemo(() => {
    if (!applicationsResponse || Array.isArray(applicationsResponse)) {
      return null;
    }
    return "pagination" in applicationsResponse
      ? applicationsResponse.pagination
      : null;
  }, [applicationsResponse]);

  // Status color helper
  const getStatusColor = useCallback((status?: string) => {
    if (!status) return "default";

    const statusUpper = status.toUpperCase();
    if (
      statusUpper === "SUBMITTED" ||
      statusUpper === "APPROVED" ||
      statusUpper === "ACCEPTED"
    ) {
      return "success";
    }
    if (
      statusUpper === "PENDING" ||
      statusUpper === "IN_REVIEW" ||
      statusUpper === "UNDER_REVIEW"
    ) {
      return "warning";
    }
    if (statusUpper === "REJECTED" || statusUpper === "VISA_REJECTED") {
      return "error";
    }
    if (statusUpper === "DRAFT") {
      return "default";
    }
    return "info";
  }, []);

  // Handlers
  const handleView = useCallback(
    (id: number) => {
      router.push(`/applications/${id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (id: number) => {
      if (onEdit) {
        onEdit(id);
      } else {
        router.push(`/applications/${id}/edit`);
      }
    },
    [router, onEdit]
  );

  const handleDelete = useCallback(
    async (id: number, applicationRef: string) => {
      if (
        !confirm(
          `Are you sure you want to delete application ${applicationRef}? This action cannot be undone.`
        )
      ) {
        return;
      }

      try {
        await deleteApplication(id).unwrap();
        showToast.success("Application deleted successfully");
      } catch (error: any) {
        const errorMessage =
          error?.data?.message ||
          error?.message ||
          "Failed to delete application. Please try again.";
        showToast.error(errorMessage);
      }
    },
    [deleteApplication]
  );

  const handleChangeStatusClick = useCallback(
    (id: number, applicationRef: string, currentStatus?: string) => {
      setStatusModal({
        open: true,
        applicationId: id,
        applicationRef,
        currentStatus,
      });
    },
    []
  );

  const handleStatusChange = useCallback(
    async (applicationId: number, newStatus: string) => {
      try {
        await updateStatus({ applicationId, status: newStatus }).unwrap();
        showToast.success("Application status updated successfully");
        setStatusModal({
          open: false,
          applicationId: null,
          applicationRef: "",
        });
        refetch();
      } catch (error: any) {
        const errorMessage =
          error?.data?.message ||
          error?.message ||
          "Failed to update status. Please try again.";
        showToast.error(errorMessage);
        throw error; // Re-throw to let modal handle it
      }
    },
    [updateStatus, refetch]
  );

  const handleChangeRegisteredClick = useCallback(
    (id: number, applicationRef: string, currentRegistered?: boolean) => {
      setRegisteredModal({
        open: true,
        applicationId: id,
        applicationRef,
        currentRegistered,
      });
    },
    []
  );

  const handleRegisteredChange = useCallback(
    async (applicationId: number, registered: boolean) => {
      try {
        await updateRegistered({ applicationId, registered }).unwrap();
        showToast.success("Registration status updated successfully");
        setRegisteredModal({
          open: false,
          applicationId: null,
          applicationRef: "",
        });
        refetch();
      } catch (error: any) {
        const errorMessage =
          error?.data?.message ||
          error?.message ||
          "Failed to update registration status. Please try again.";
        showToast.error(errorMessage);
        throw error; // Re-throw to let modal handle it
      }
    },
    [updateRegistered, refetch]
  );

  const handleChangeAssignedToClick = useCallback(
    (id: number, applicationRef: string, currentUser?: any) => {
      setUserModal({
        open: true,
        applicationId: id,
        applicationRef,
        fieldType: "assignedTo",
        currentUser,
      });
    },
    []
  );

  const handleChangeAssignedAgentClick = useCallback(
    (id: number, applicationRef: string, currentUser?: any) => {
      setUserModal({
        open: true,
        applicationId: id,
        applicationRef,
        fieldType: "assignedAgent",
        currentUser,
      });
    },
    []
  );

  const handleUserChange = useCallback(
    async (
      applicationId: number,
      userId: number | null,
      fieldType: "assignedTo" | "assignedAgent"
    ) => {
      try {
        if (fieldType === "assignedTo") {
          await updateAssignedTo({
            applicationId,
            assignedToId: userId,
          }).unwrap();
          showToast.success("Handled By updated successfully");
        } else {
          await updateAssignedAgent({
            applicationId,
            assignedAgentId: userId,
          }).unwrap();
          showToast.success("Agent updated successfully");
        }
        setUserModal({
          open: false,
          applicationId: null,
          applicationRef: "",
          fieldType: "assignedTo",
        });
        refetch();
      } catch (error: any) {
        const errorMessage =
          error?.data?.message ||
          error?.message ||
          `Failed to update ${
            fieldType === "assignedTo" ? "Handled By" : "Agent"
          }. Please try again.`;
        showToast.error(errorMessage);
        throw error; // Re-throw to let modal handle it
      }
    },
    [updateAssignedTo, updateAssignedAgent, refetch]
  );

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  // Debounced search - we'll use immediate search with backend filtering
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(event.target.value);
      setPaginationModel((prev) => ({ ...prev, page: 0 })); // Reset to first page on search
    },
    []
  );

  // Column definitions - Ordered by importance
  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "applicationRef",
        headerName: "Application Ref",
        width: 140,
        flex: 0,
        filterable: true,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <Typography variant="body2" className="font-medium">
              {params.value || "N/A"}
            </Typography>
          </Box>
        ),
      },
      {
        field: "studentName",
        headerName: "Student Name",
        width: 160,
        flex: 0,
        filterable: true,
        valueGetter: (value, row: Application) => {
          if (row.student) {
            return `${row.student.firstName || ""} ${
              row.student.lastName || ""
            }`.trim();
          }
          return "N/A";
        },
      },
      {
        field: "phone",
        headerName: "Phone",
        width: 120,
        flex: 0,
        filterable: true,
        valueGetter: (value, row: Application) => {
          return row.student?.phone || "N/A";
        },
        renderCell: (params) => {
          return <Typography variant="body2">{params.value || "-"}</Typography>;
        },
      },
      {
        field: "country",
        headerName: "Country",
        width: 100,
        flex: 0,
        filterable: true,
        type: "singleSelect",
        valueOptions: countries.map((country) => ({
          value: country.id.toString(),
          label: country.name,
        })),
        valueGetter: (value, row: Application) => {
          return (row as any).country?.id?.toString() || "";
        },
        renderCell: (params) => {
          const country = (params.row as any).country;
          if (!country) {
            return <Chip label="N/A" size="small" variant="outlined" />;
          }
          return (
            <Chip
              label={country.name}
              size="small"
              variant="outlined"
              sx={{
                backgroundColor: "#f0f0f0",
              }}
            />
          );
        },
      },
      {
        field: "status",
        headerName: "Status",
        width: 100,
        flex: 0,
        filterable: true,
        type: "singleSelect",
        valueOptions: availableStatuses.map((status: ApplicationStatus) => ({
          value: status.status,
          label: status.status
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
        })),
        valueGetter: (value, row: Application) => {
          return row.applicationStatus?.status || "draft";
        },
        renderCell: (params) => {
          const status = params.value as string;
          const formattedStatus = status
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
          return (
            <Chip
              label={formattedStatus}
              color={getStatusColor(status)}
              size="small"
              variant="outlined"
            />
          );
        },
      },
      {
        field: "registered",
        headerName: "Registered",
        width: 100,
        flex: 0,
        filterable: true,
        type: "boolean",
        valueGetter: (value, row: Application) => {
          return row.registered ?? false;
        },
        renderCell: (params) => {
          return (
            <Chip
              label={params.value ? "Yes" : "No"}
              size="small"
              color={params.value ? "success" : "default"}
              variant="outlined"
            />
          );
        },
      },
      {
        field: "intendedProgram",
        headerName: "Program",
        width: 160,
        flex: 0,
        filterable: true,
        valueGetter: (value, row: Application) => {
          return row.intendedProgram || "N/A";
        },
        renderCell: (params) => {
          return (
            <Typography
              variant="body2"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "280px",
              }}
              title={params.value as string}
            >
              {params.value || "N/A"}
            </Typography>
          );
        },
      },
      {
        field: "asignedTo",
        headerName: "Handled By",
        width: 120,
        flex: 0,
        filterable: true,
        valueGetter: (value, row: Application) => {
          const user = row.assignedTo || row.asignedTo;
          return user
            ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "N/A"
            : "N/A";
        },
        renderCell: (params) => {
          const user = params.row.assignedTo || params.row.asignedTo;
          if (!user) {
            return <Chip label="N/A" size="small" variant="outlined" />;
          }
          const name =
            `${user.firstName || ""} ${user.lastName || ""}`.trim() || "N/A";
          return (
            <Chip
              label={name}
              size="small"
              sx={{
                backgroundColor: "#1e293b",
                color: "white",
                "&:hover": {
                  backgroundColor: "#334155",
                },
              }}
            />
          );
        },
      },
      {
        field: "asignedAgent",
        headerName: "Agent",
        width: 120,
        flex: 0,
        filterable: true,
        valueGetter: (value, row: Application) => {
          const user = row.assignedAgent || row.asignedAgent;
          return user
            ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "N/A"
            : "N/A";
        },
        renderCell: (params) => {
          const user = params.row.assignedAgent || params.row.asignedAgent;
          if (!user) {
            return <Chip label="N/A" size="small" variant="outlined" />;
          }
          const name =
            `${user.firstName || ""} ${user.lastName || ""}`.trim() || "N/A";
          return (
            <Chip
              label={name}
              size="small"
              sx={{
                backgroundColor: "#15803d",
                color: "white",
                "&:hover": {
                  backgroundColor: "#16a34a",
                },
              }}
            />
          );
        },
      },
      {
        field: "submissionDate",
        headerName: "Submission Date",
        width: 100,
        flex: 0,
        filterable: true,
        type: "date",
        valueGetter: (value, row: Application) => {
          if (!row.submissionDate) return null;
          return new Date(row.submissionDate);
        },
        renderCell: (params) => {
          if (!params.value) return "Not submitted";
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
          const application = params.row as Application;
          return (
            <ActionsMenu
              applicationId={application.id}
              onView={() => handleView(application.id)}
              onEdit={() => handleEdit(application.id)}
              onDelete={() =>
                handleDelete(application.id, application.applicationRef)
              }
              onChangeStatus={() =>
                handleChangeStatusClick(
                  application.id,
                  application.applicationRef,
                  application.applicationStatus?.status
                )
              }
              onChangeAssignedTo={() =>
                handleChangeAssignedToClick(
                  application.id,
                  application.applicationRef,
                  application.assignedTo || application.asignedTo
                )
              }
              onChangeAssignedAgent={() =>
                handleChangeAssignedAgentClick(
                  application.id,
                  application.applicationRef,
                  application.assignedAgent || application.asignedAgent
                )
              }
              onChangeRegistered={() =>
                handleChangeRegisteredClick(
                  application.id,
                  application.applicationRef,
                  (application as any).registered
                )
              }
            />
          );
        },
      },
    ],
    [
      handleView,
      handleEdit,
      handleDelete,
      handleChangeStatusClick,
      handleChangeAssignedToClick,
      handleChangeAssignedAgentClick,
      handleChangeRegisteredClick,
      getStatusColor,
      availableStatuses,
      countries,
    ]
  );

  // Loading state
  if (isLoading && !applications.length) {
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
            Error loading applications
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {error && "data" in error
              ? String(error.data)
              : "An unexpected error occurred"}
          </Typography>
          <Button
            variant="primary"
            onClick={() => refetch()}
            size="md"
            className="mt-4 flex items-center"
          >
            <RefreshIcon className="w-4 h-4 mr-2" />
            Retry
          </Button>
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
            Applications
          </Typography>
          <Button
            variant="secondary"
            onClick={() => {
              refetch();
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            size="sm"
            className="flex items-center"
            disabled={isLoading}
          >
            <RefreshIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </Box>

        {/* Search and Filter Controls */}
        <Box display="flex" gap={2} flexWrap="wrap">
          {/* Global Search */}
          <TextField
            placeholder="Search applications..."
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
          rows={applications}
          columns={columns}
          getRowId={(row) => row.id}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          filterModel={filterModel}
          onFilterModelChange={(newModel) => {
            setFilterModel(newModel);
            setPaginationModel((prev) => ({ ...prev, page: 0 }));
          }}
          pageSizeOptions={[10, 25, 50, 100, { value: -1, label: "All" }]}
          loading={isLoading}
          disableRowSelectionOnClick
          className="border-0"
          autoHeight={false}
          disableColumnResize={false}
          sx={{
            "& .MuiDataGrid-cell": {
              display: "flex",
              alignItems: "center",
            },
            "& .MuiDataGrid-cell:focus": {
              outline: "none",
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.04)",
            },
            "& .MuiDataGrid-root": {
              overflowX: "auto",
            },
          }}
          rowCount={pagination?.totalItems || applications.length}
          paginationMode={pagination ? "server" : "client"}
          sortingMode="server"
          filterMode="server"
          slots={{
            toolbar: GridToolbar,
            noRowsOverlay: () => (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  p: 4,
                }}
              >
                <EmptyState
                  title="No applications found"
                  message={
                    searchTerm || filterModel.items?.length > 0
                      ? "Try adjusting your search or filter criteria to find applications."
                      : "Get started by creating your first application."
                  }
                  actionLabel={
                    !searchTerm &&
                    (!filterModel.items || filterModel.items.length === 0)
                      ? "Start New Application"
                      : undefined
                  }
                  actionHref={
                    !searchTerm &&
                    (!filterModel.items || filterModel.items.length === 0)
                      ? "/applications/new"
                      : undefined
                  }
                />
              </Box>
            ),
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

      {/* Status Change Modal */}
      {statusModal.applicationId && (
        <StatusChangeModal
          open={statusModal.open}
          onClose={() =>
            setStatusModal({
              open: false,
              applicationId: null,
              applicationRef: "",
            })
          }
          applicationId={statusModal.applicationId}
          applicationRef={statusModal.applicationRef}
          currentStatus={statusModal.currentStatus}
          availableStatuses={availableStatuses}
          onStatusChange={handleStatusChange}
          isAdmin={isAdmin}
        />
      )}

      {/* Registered Change Modal */}
      {registeredModal.applicationId && (
        <RegisteredChangeModal
          open={registeredModal.open}
          onClose={() =>
            setRegisteredModal({
              open: false,
              applicationId: null,
              applicationRef: "",
            })
          }
          applicationId={registeredModal.applicationId}
          applicationRef={registeredModal.applicationRef}
          currentRegistered={registeredModal.currentRegistered}
          onRegisteredChange={handleRegisteredChange}
        />
      )}

      {/* User Change Modal */}
      {userModal.applicationId && (
        <UserChangeModal
          open={userModal.open}
          onClose={() =>
            setUserModal({
              open: false,
              applicationId: null,
              applicationRef: "",
              fieldType: "assignedTo",
            })
          }
          applicationId={userModal.applicationId}
          applicationRef={userModal.applicationRef}
          currentUser={userModal.currentUser}
          availableUsers={availableUsers}
          fieldType={userModal.fieldType}
          onUserChange={handleUserChange}
        />
      )}
    </Paper>
  );
};
