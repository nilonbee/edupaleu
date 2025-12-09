"use client";
import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  GetApplicationsParams,
  ApplicationsResponse,
} from "@/state/applicationApi";
import { Application, ApplicationStatus } from "@/state/api";
import { useGetApplicationStatusesQuery } from "@/state/api";
import { showToast } from "@/utils/toast";
import { ActionsMenu } from "./ActionsMenu";
import { StatusChangeModal } from "./StatusChangeModal";
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
}

export const ApplicationsTable: React.FC<ApplicationsTableProps> = ({
  onEdit,
}) => {
  const router = useRouter();

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "updatedAt", sort: "desc" },
  ]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });

  // Status change modal state
  const [statusModal, setStatusModal] = useState<StatusChangeModalState>({
    open: false,
    applicationId: null,
    applicationRef: "",
    currentStatus: undefined,
  });

  // Build query parameters
  const queryParams: GetApplicationsParams = useMemo(() => {
    const params: GetApplicationsParams = {
      page: paginationModel.page + 1, // Backend uses 1-based pagination
      limit: paginationModel.pageSize,
    };

    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }

    // Extract status filter from DataGrid filterModel
    const statusFilterItem = filterModel.items?.find((item: any) => item.field === "status");
    if (statusFilterItem && statusFilterItem.value) {
      // Handle both single value and array of values
      const statusValue = Array.isArray(statusFilterItem.value) 
        ? statusFilterItem.value.join(',')
        : statusFilterItem.value;
      if (statusValue) {
        params.status = statusValue;
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

  const [deleteApplication, { isLoading: isDeleting }] =
    useDeleteApplicationMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateApplicationStatusMutation();

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

  // Column definitions
  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "applicationRef",
        headerName: "Application Ref",
        width: 150,
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
        width: 200,
        flex: 1,
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
        field: "university",
        headerName: "University",
        width: 200,
        flex: 1,
        filterable: true,
        valueGetter: (value, row: Application) => {
          return row.university?.name || "N/A";
        },
      },
      {
        field: "intendedProgram",
        headerName: "Program",
        width: 250,
        flex: 1,
        filterable: true,
        valueGetter: (value, row: Application) => {
          return row.intendedProgram || "N/A";
        },
      },
      {
        field: "status",
        headerName: "Status",
        width: 150,
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
        field: "submissionDate",
        headerName: "Submission Date",
        width: 150,
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
      getStatusColor,
      availableStatuses,
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
            onClick={() => refetch()}
            size="sm"
            className="flex items-center"
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
          pageSizeOptions={[10, 25, 50, 100]}
          loading={isLoading}
          disableRowSelectionOnClick
          className="border-0"
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
          }}
          rowCount={pagination?.totalItems || applications.length}
          paginationMode={pagination ? "server" : "client"}
          sortingMode="server"
          filterMode="server"
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
      {!isLoading && applications.length === 0 && (
        <EmptyState
          title="No applications found"
          message={
            searchTerm || filterModel.items?.length > 0
              ? "Try adjusting your search or filter criteria to find applications."
              : "Get started by creating your first application."
          }
          actionLabel={
            !searchTerm && (!filterModel.items || filterModel.items.length === 0) ? "Start New Application" : undefined
          }
          actionHref={
            !searchTerm && (!filterModel.items || filterModel.items.length === 0) ? "/applications/new" : undefined
          }
        />
      )}

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
        />
      )}
    </Paper>
  );
};
