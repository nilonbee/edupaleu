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
  InputAdornment,
  IconButton,
  Paper,
  CircularProgress,
  Button as MuiButton,
  Chip,
  Typography,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import {
  useGetAllEnquiriesQuery,
  useDeleteEnquiryMutation,
  EnquiryQueryParams,
  Enquiry,
} from "@/state/enquiryApi";
import { useGetAllUsersQuery } from "@/state/userApi";
import { useAppSelector } from "@/app/redux";
import { showToast } from "@/utils/toast";
import { ActionsMenu } from "./ActionsMenu";
import { EmptyState } from "@/app/(components)/EmptyState";
import Button from "@/app/(components)/Button";

interface EnquiriesTableProps {
  onEdit?: (id: number) => void;
  onCreate?: () => void;
}

// Agent color mapping - static colors for each agent
const getAgentColor = (userId?: number): string => {
  if (!userId) return "bg-gray-500";
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

export const EnquiriesTable: React.FC<EnquiriesTableProps> = ({
  onEdit,
  onCreate,
}) => {
  const router = useRouter();
  const currentUser = useAppSelector((state) => state.auth.user);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "createdAt", sort: "desc" },
  ]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  });

  // Build query parameters
  const queryParams: EnquiryQueryParams = useMemo(() => {
    const params: EnquiryQueryParams = {
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
    };

    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }

    // Extract assignedTo filter from DataGrid filterModel
    const assignedToFilterItem = filterModel.items?.find(
      (item: any) => item.field === "assignedTo"
    );
    if (assignedToFilterItem && assignedToFilterItem.value) {
      params.assignedTo = parseInt(assignedToFilterItem.value, 10);
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
    data: enquiriesResponse,
    isLoading,
    error,
    refetch,
  } = useGetAllEnquiriesQuery(queryParams);

  const { data: usersResponse } = useGetAllUsersQuery();
  const agents = useMemo(() => {
    if (!usersResponse) return [];
    return (usersResponse.data || []).filter(
      (user) => user.role === "agent" || user.role === "admin"
    );
  }, [usersResponse]);

  const [deleteEnquiry, { isLoading: isDeleting }] = useDeleteEnquiryMutation();

  const enquiries = useMemo(() => {
    if (!enquiriesResponse) return [];
    return enquiriesResponse.data || [];
  }, [enquiriesResponse]);

  // Handlers
  const handleView = useCallback(
    (id: number) => {
      router.push(`/enquiries/${id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (id: number) => {
      if (onEdit) {
        onEdit(id);
      } else {
        router.push(`/enquiries/${id}/edit`);
      }
    },
    [router, onEdit]
  );

  const handleDelete = useCallback(
    async (id: number, name: string) => {
      if (
        !confirm(
          `Are you sure you want to delete enquiry for ${name}? This action cannot be undone.`
        )
      ) {
        return;
      }

      try {
        await deleteEnquiry(id).unwrap();
        showToast.success("Enquiry deleted successfully");
        refetch();
      } catch (error: any) {
        const errorMessage =
          error?.data?.message ||
          error?.message ||
          "Failed to delete enquiry. Please try again.";
        showToast.error(errorMessage);
      }
    },
    [deleteEnquiry, refetch]
  );

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  const handleCreateApplication = useCallback(
    (enquiry: Enquiry) => {
      // Navigate to application creation with enquiry data
      const enquiryData = encodeURIComponent(
        JSON.stringify({
          enquiryId: enquiry.id,
          firstName: enquiry.firstName,
          lastName: enquiry.lastName || "",
          email: enquiry.email || "",
          phone: enquiry.phone,
        })
      );
      router.push(`/applications/new?enquiry=${enquiryData}`);
    },
    [router]
  );

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 80,
        filterable: true,
      },
      {
        field: "firstName",
        headerName: "Name",
        width: 200,
        filterable: true,
        renderCell: (params) => (
          <div>
            {params.row.firstName} {params.row.lastName || ""}
          </div>
        ),
      },
      {
        field: "email",
        headerName: "Email",
        width: 200,
        filterable: true,
        renderCell: (params) => params.row.email || "-",
      },
      {
        field: "phone",
        headerName: "Phone",
        width: 150,
        filterable: true,
      },
      {
        field: "assignedTo",
        headerName: "Agent",
        width: 150,
        filterable: true,
        type: "singleSelect",
        valueOptions: agents.map((agent) => ({
          value: agent.id.toString(),
          label: `${agent.firstName} ${agent.lastName}`,
        })),
        valueGetter: (value, row: Enquiry) => {
          return row.assignedTo?.id?.toString() || "";
        },
        renderCell: (params) => {
          const agent = params.row.assignedTo;
          if (!agent) return "-";
          const color = getAgentColor(agent.id);
          return (
            <Chip
              label={`${agent.firstName} ${agent.lastName}`}
              size="small"
              className={`${color} text-white`}
            />
          );
        },
      },
      {
        field: "createdBy",
        headerName: "Created By",
        width: 150,
        filterable: true,
        renderCell: (params) => params.row.createdBy || "-",
      },
      {
        field: "createdAt",
        headerName: "Created",
        width: 150,
        filterable: true,
        type: "date",
        valueGetter: (value) => (value ? new Date(value) : null),
        renderCell: (params) => {
          if (!params.value) return "-";
          return params.value.toLocaleDateString();
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 100,
        sortable: false,
        filterable: false,
        disableColumnFilter: true,
        renderCell: (params) => {
          const enquiry = params.row as Enquiry;
          return (
            <ActionsMenu
              enquiryId={enquiry.id}
              onView={() => handleView(enquiry.id)}
              onEdit={() => handleEdit(enquiry.id)}
              onDelete={() =>
                handleDelete(
                  enquiry.id,
                  `${enquiry.firstName} ${enquiry.lastName || ""}`
                )
              }
              onCreateApplication={() => handleCreateApplication(enquiry)}
            />
          );
        },
      },
    ],
    [handleView, handleEdit, handleDelete, handleCreateApplication, agents]
  );

  if (error) {
    return (
      <Box className="p-4">
        <Paper className="p-6 text-center">
          <Typography variant="h6" color="error" className="mb-4">
            Failed to load enquiries
          </Typography>
          <MuiButton
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            className="mt-4"
          >
            Retry
          </MuiButton>
        </Paper>
      </Box>
    );
  }

  return (
    <Box className="w-full">
      <Paper className="p-4 mb-4">
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            className="flex-1 min-w-[250px]"
          />

          <Box display="flex" gap={2}>
            <MuiButton
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
              size="small"
            >
              Refresh
            </MuiButton>
            {(currentUser?.role === "admin" ||
              currentUser?.role === "agent") && (
              <Button
                variant="primary"
                size="md"
                onClick={onCreate}
                className="flex items-center"
              >
                <AddIcon className="w-4 h-4 mr-2" />
                Create Enquiry
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      <Paper style={{ height: 600, width: "100%", position: "relative" }}>
        {!isLoading && !isDeleting && enquiries.length === 0 ? (
          <EmptyState
            title="No enquiries found"
            message={
              searchTerm || filterModel.items?.length > 0
                ? "Try adjusting your search or filter criteria to find enquiries."
                : "Get started by creating your first enquiry."
            }
            actionLabel={
              !searchTerm &&
              (!filterModel.items || filterModel.items.length === 0) &&
              onCreate
                ? "Create Enquiry"
                : undefined
            }
            onAction={
              !searchTerm &&
              (!filterModel.items || filterModel.items.length === 0) &&
              onCreate
                ? onCreate
                : undefined
            }
          />
        ) : (
          <DataGrid
            rows={enquiries}
            columns={columns}
            getRowId={(row) => row.id}
            loading={isLoading || isDeleting}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50, 100]}
            sortModel={sortModel}
            onSortModelChange={setSortModel}
            filterModel={filterModel}
            onFilterModelChange={(newModel) => {
              setFilterModel(newModel);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            disableRowSelectionOnClick
            className="bg-white"
            rowCount={enquiriesResponse?.pagination?.totalItems || 0}
            paginationMode="server"
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
        )}
      </Paper>
    </Box>
  );
};
