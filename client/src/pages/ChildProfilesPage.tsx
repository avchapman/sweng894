import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArchiveIcon from "@mui/icons-material/Archive";
import EditIcon from "@mui/icons-material/Edit";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import apiClient from "../api/client";

type ChildProfile = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  notes?: string | null;
  archived: boolean;
};

type ChildFormData = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  notes: string;
};

const emptyForm: ChildFormData = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  notes: "",
};

function formatDateOnly(value?: string | null) {
  if (!value) return "";

  const [year, month, day] = value.slice(0, 10).split("-");
  return `${month}/${day}/${year}`;
}

export default function ChildProfilesPage() {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);
  const [formData, setFormData] = useState<ChildFormData>(emptyForm);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadChildren() {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/child-profiles");
      setChildren(response.data);
    } catch {
      setError("Unable to load child profiles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadChildren();
  }, []);

  function openCreateDialog() {
    setSelectedChild(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(child: ChildProfile) {
    setSelectedChild(child);
    setFormData({
      firstName: child.firstName,
      lastName: child.lastName,
      dateOfBirth: child.dateOfBirth ? child.dateOfBirth.slice(0, 10) : "",
      notes: child.notes || "",
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setSelectedChild(null);
    setFormData(emptyForm);
  }

  async function handleSubmit() {
    if (!formData.firstName || !formData.lastName) {
      setError("First name and last name are required.");
      return;
    }

    try {
      if (selectedChild) {
        await apiClient.put(`/child-profiles/${selectedChild.id}`, formData);

        setChildren((currentChildren) =>
          currentChildren.map((child) =>
            child.id === selectedChild.id
              ? {
                  ...child,
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  dateOfBirth: formData.dateOfBirth,
                  notes: formData.notes,
                }
              : child
          )
        );

        setSuccessMessage("Child profile updated successfully.");
      } else {
        const response = await apiClient.post("/child-profiles", formData);

        setChildren((currentChildren) => [response.data, ...currentChildren]);

        setSuccessMessage("Child profile created successfully.");
      }

      closeDialog();
    } catch {
      setError("Unable to save child profile.");
    }
  }

  async function handleArchive(id: string) {
    try {
      await apiClient.patch(`/child-profiles/${id}/archive`);

      setChildren((currentChildren) =>
        currentChildren.filter((child) => child.id !== id)
      );

      setSuccessMessage("Child profile archived successfully.");
    } catch {
      setError("Unable to archive child profile.");
    }
  }

  const columns: GridColDef<ChildProfile>[] = [
    {
      field: "firstName",
      headerName: "First Name",
      flex: 1,
      minWidth: 140,
    },
    {
      field: "lastName",
      headerName: "Last Name",
      flex: 1,
      minWidth: 140,
    },
    {
      field: "dateOfBirth",
      headerName: "Date of Birth",
      flex: 1,
      minWidth: 160,
      valueGetter: (value) => formatDateOnly(value as string | null),
    },
    {
      field: "notes",
      headerName: "Notes",
      flex: 1.5,
      minWidth: 220,
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 120,
      getActions: ({ row }) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Edit"
          onClick={() => openEditDialog(row)}
        />,
        <GridActionsCellItem
          key="archive"
          icon={<ArchiveIcon />}
          label="Archive"
          onClick={() => handleArchive(row.id)}
          showInMenu
        />,
      ],
    },
  ];

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography variant="h4">Child Profiles</Typography>
          <Typography color="text.secondary">
            Manage child records for your organization.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          Add Child
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ height: 520, bgcolor: "background.paper", borderRadius: 3 }}>
        <DataGrid
          rows={children}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          sx={{
            border: 0,
            "& .MuiDataGrid-columnHeaders": {
              bgcolor: "grey.50",
            },
          }}
        />
      </Box>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {selectedChild ? "Edit Child Profile" : "Add Child Profile"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="First Name"
              value={formData.firstName}
              onChange={(event) =>
                setFormData({ ...formData, firstName: event.target.value })
              }
              fullWidth
              required
            />

            <TextField
              label="Last Name"
              value={formData.lastName}
              onChange={(event) =>
                setFormData({ ...formData, lastName: event.target.value })
              }
              fullWidth
              required
            />

            <TextField
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(event) =>
                setFormData({ ...formData, dateOfBirth: event.target.value })
              }
              fullWidth
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />

            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(event) =>
                setFormData({ ...formData, notes: event.target.value })
              }
              fullWidth
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {selectedChild ? "Save Changes" : "Create Profile"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage("")}
        message={successMessage}
      />
    </Stack>
  );
}