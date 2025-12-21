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
  useGetCountriesQuery,
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

// Next Step color mapping - vibrant colors for visual distinction
const getNextStepColors = (
  index: number
): { bg: string; border: string; text: string } => {
  const colorSchemes = [
    { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-800" },
    { bg: "bg-green-50", border: "border-green-300", text: "text-green-800" },
    {
      bg: "bg-purple-50",
      border: "border-purple-300",
      text: "text-purple-800",
    },
    { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-800" },
    { bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-800" },
    { bg: "bg-cyan-50", border: "border-cyan-300", text: "text-cyan-800" },
    {
      bg: "bg-indigo-50",
      border: "border-indigo-300",
      text: "text-indigo-800",
    },
    { bg: "bg-teal-50", border: "border-teal-300", text: "text-teal-800" },
  ];
  return colorSchemes[index % colorSchemes.length];
};

// Parse remarks string to extract text, user, and timestamp
// Format: "timestamp||text||user" (timestamp first for sortability)
const parseRemarks = (
  remarks: string | null | undefined
): { text: string; user: string; timestamp: string } | null => {
  if (!remarks) return null;
  const parts = remarks.split("||");
  if (parts.length >= 3) {
    // New format: timestamp||text||user
    return {
      timestamp: parts[0] || "",
      text: parts[1] || "",
      user: parts[2] || "",
    };
  } else if (parts.length === 2) {
    // Could be old format (text||user) or partial - check if first part looks like ISO date
    if (parts[0].match(/^\d{4}-\d{2}-\d{2}T/)) {
      // Looks like new format with missing user
      return { timestamp: parts[0], text: parts[1], user: "" };
    }
    // Old format: text||user (no timestamp)
    return { text: parts[0], user: parts[1], timestamp: "" };
  }
  // Legacy format without delimiter - just text
  return { text: remarks, user: "", timestamp: "" };
};

// Get initials from name
const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name[0]?.toUpperCase() || "?";
};

// Get consistent color based on username string (hash-based)
const getColorFromUsername = (username: string): string => {
  if (!username) return "bg-gray-500";
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
  // Simple hash from username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
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
    { field: "updatedAt", sort: "desc" },
  ]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  });

  // Build query parameters
  const queryParams: EnquiryQueryParams = useMemo(() => {
    const params: EnquiryQueryParams = {
      page: paginationModel.pageSize === -1 ? 1 : paginationModel.page + 1,
      limit: paginationModel.pageSize === -1 ? 10000 : paginationModel.pageSize,
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

    // Extract country filter from DataGrid filterModel
    const countryFilterItem = filterModel.items?.find(
      (item: any) => item.field === "country"
    );
    if (countryFilterItem && countryFilterItem.value) {
      // If value is a string (country name), we need to find the country ID
      // For now, we'll handle it in the backend by searching country name
      // But if it's a number, use it directly
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
    data: enquiriesResponse,
    isLoading,
    error,
    refetch,
  } = useGetAllEnquiriesQuery(queryParams);

  const { data: usersResponse } = useGetAllUsersQuery();
  const { data: countriesResponse } = useGetCountriesQuery();
  const countries = useMemo(
    () => countriesResponse?.data || [],
    [countriesResponse]
  );

  const agents = useMemo(() => {
    if (!usersResponse) return [];
    return (usersResponse.data || []).filter(
      (user) =>
        user.role === "agent" || user.role === "admin" || user.role === "user"
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
        width: 100,
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
        width: 100,
        filterable: true,
        renderCell: (params) => params.row.email || "-",
      },
      {
        field: "phone",
        headerName: "Phone",
        width: 100,
        filterable: true,
      },
      {
        field: "country",
        headerName: "Country",
        width: 100,
        filterable: true,
        type: "singleSelect",
        valueOptions: countries.map((country) => ({
          value: country.id.toString(),
          label: country.name,
        })),
        valueGetter: (value, row: Enquiry) => {
          return row.country?.id?.toString() || "";
        },
        renderCell: (params) => {
          const country = params.row.country;
          if (!country) {
            return <Typography variant="body2">N/A</Typography>;
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
        field: "assignedTo",
        headerName: "Asigneee",
        width: 100,
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
        field: "firstFollowUpRemarks",
        headerName: "1st Remark",
        width: 100,
        flex: 0,
        filterable: true,
        valueGetter: (value, row: Enquiry) => {
          return row.firstFollowUpRemarks || "N/A";
        },
        renderCell: (params) => {
          const remark = params.value as string;
          if (!remark || remark === "N/A") {
            return <Typography variant="body2">-</Typography>;
          }
          return (
            <Typography
              variant="body2"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "280px",
              }}
              title={remark}
            >
              {remark}
            </Typography>
          );
        },
      },
      {
        field: "secondFollowUpRemarks",
        headerName: "2nd Remark",
        width: 100,
        flex: 0,
        filterable: true,
        valueGetter: (value, row: Enquiry) => {
          return row.secondFollowUpRemarks || "N/A";
        },
        renderCell: (params) => {
          const remark = params.value as string;
          if (!remark || remark === "N/A") {
            return <Typography variant="body2">-</Typography>;
          }
          return (
            <Typography
              variant="body2"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "280px",
              }}
              title={remark}
            >
              {remark}
            </Typography>
          );
        },
      },
      {
        field: "thirdFollowUpRemarks",
        headerName: "3rd Remark",
        width: 100,
        flex: 0,
        filterable: true,
        valueGetter: (value, row: Enquiry) => {
          return row.thirdFollowUpRemarks || "N/A";
        },
        renderCell: (params) => {
          const remark = params.value as string;
          if (!remark || remark === "N/A") {
            return <Typography variant="body2">-</Typography>;
          }
          return (
            <Typography
              variant="body2"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "280px",
              }}
              title={remark}
            >
              {remark}
            </Typography>
          );
        },
      },
      {
        field: "remarks",
        headerName: "Next Step",
        width: 130,
        filterable: false,
        flex: 0,
        sortable: true,
        renderCell: (params) => {
          const parsed = parseRemarks(params.row.remarks);
          if (!parsed || !parsed.text) {
            return (
              <Typography variant="body2" className="text-gray-400 italic">
                -
              </Typography>
            );
          }

          const colors = getNextStepColors(params.row.id % 8);

          return (
            <div
              className={`flex flex-col w-full rounded-xl m-1 p-1 ${colors.bg} ${colors.border}`}
              title={`${parsed.text}${parsed.user ? ` ~ ${parsed.user}` : ""}`}
            >
              <Typography
                variant="body2"
                className={`${colors.text} font-medium text-xs`}
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {parsed.text}
              </Typography>
              {parsed.user && (
                <div className="flex items-center gap-1.5 mt-1">
                  <div
                    className={`w-5 h-5 rounded-xl flex items-center justify-center text-[10px] font-bold text-white ${getColorFromUsername(
                      parsed.user
                    )}`}
                  >
                    {getInitials(parsed.user)}
                  </div>
                  <Typography
                    variant="caption"
                    className="text-gray-500 text-xs"
                  >
                    {parsed.user}
                  </Typography>
                </div>
              )}
            </div>
          );
        },
      },
      {
        field: "createdBy",
        headerName: "Created By",
        width: 100,
        flex: 0,
        filterable: true,
        renderCell: (params) => (
          <Typography variant="body2">{params.row.createdBy || "-"}</Typography>
        ),
      },
      {
        field: "updatedAt",
        headerName: "Updated",
        width: 100,
        flex: 0,
        filterable: true,
        type: "date",
        valueGetter: (value) => (value ? new Date(value) : null),
        renderCell: (params) => {
          if (!params.value) return "-";
          return (
            <Typography variant="body2">
              {params.value.toLocaleDateString()}
            </Typography>
          );
        },
      },
      {
        field: "createdAt",
        headerName: "Created",
        width: 100,
        flex: 0,
        filterable: true,
        type: "date",
        valueGetter: (value) => (value ? new Date(value) : null),
        renderCell: (params) => {
          if (!params.value) return "-";
          return (
            <Typography variant="body2">
              {params.value.toLocaleDateString()}
            </Typography>
          );
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
    [
      handleView,
      handleEdit,
      handleDelete,
      handleCreateApplication,
      agents,
      countries,
    ]
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
              onClick={() => {
                refetch();
                setPaginationModel((prev) => ({ ...prev, page: 0 }));
              }}
              size="small"
              disabled={isLoading}
            >
              Refresh
            </MuiButton>
            <Button
              variant="primary"
              size="md"
              onClick={onCreate}
              className="flex items-center"
            >
              <AddIcon className="w-4 h-4 mr-2" />
              Create Enquiry
            </Button>
          </Box>
        </Box>
      </Paper>

      <Paper style={{ height: 600, width: "100%", position: "relative" }}>
        <DataGrid
          rows={enquiries}
          columns={columns}
          getRowId={(row) => row.id}
          loading={isLoading || isDeleting}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50, 100, { value: -1, label: "All" }]}
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
      </Paper>
    </Box>
  );
};
