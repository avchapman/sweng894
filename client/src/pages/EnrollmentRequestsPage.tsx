import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import apiClient from "../api/client";

type EnrollmentRequest = {
  id: string;
  parentName: string;
  email: string;
  phone?: string | null;
  childName: string;
  childAge?: number | null;
  message?: string | null;
  status: string;
  createdAt: string;
};

const statusOptions = ["NEW", "CONTACTED", "ENROLLED", "DECLINED"];

function getStatusColor(status: string) {
  switch (status) {
    case "NEW":
      return "primary";
    case "CONTACTED":
      return "warning";
    case "ENROLLED":
      return "success";
    case "DECLINED":
      return "error";
    default:
      return "default";
  }
}

export default function EnrollmentRequestsPage() {
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<EnrollmentRequest | null>(null);
  const [status, setStatus] = useState("NEW");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadRequests() {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/enrollment");
      setRequests(response.data);
    } catch {
      setError("Unable to load enrollment requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRequests();
  }, []);

  function openStatusDialog(request: EnrollmentRequest) {
    setSelectedRequest(request);
    setStatus(request.status);
    setDialogOpen(true);
  }

  function closeStatusDialog() {
    setSelectedRequest(null);
    setStatus("NEW");
    setDialogOpen(false);
  }

  async function handleStatusUpdate() {
    if (!selectedRequest) return;

    try {
      await apiClient.patch(`/enrollment/${selectedRequest.id}/status`, {
        status,
      });

      setSuccessMessage("Enrollment status updated successfully.");
      closeStatusDialog();
      await loadRequests();
    } catch {
      setError("Unable to update enrollment status.");
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Enrollment Requests</Typography>
        <Typography color="text.secondary">
          Review enrollment inquiries and manage follow-up status.
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {loading && <Typography color="text.secondary">Loading requests...</Typography>}

      {!loading && requests.length === 0 && (
        <Card>
          <CardContent>
            <Typography sx={{ fontWeight: 700 }}>No enrollment requests yet</Typography>
            <Typography color="text.secondary">
              Public enrollment inquiries will appear here once submitted.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Stack spacing={2}>
        {requests.map((request) => (
          <Card key={request.id}>
            <CardContent>
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Typography variant="h6">{request.parentName}</Typography>
                    <Typography color="text.secondary">
                      Parent inquiry for {request.childName}
                      {request.childAge ? `, age ${request.childAge}` : ""}
                    </Typography>
                  </Box>

                  <Chip
                    label={request.status}
                    color={getStatusColor(request.status)}
                    size="small"
                  />
                </Box>

                <Divider />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "1fr 1fr 1fr",
                    },
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Email
                    </Typography>
                    <Typography>{request.email}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography>{request.phone || "Not provided"}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Submitted
                    </Typography>
                    <Typography>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>

                {request.message && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Message
                    </Typography>
                    <Typography>{request.message}</Typography>
                  </Box>
                )}

                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => openStatusDialog(request)}
                  >
                    Update Status
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Dialog open={dialogOpen} onClose={closeStatusDialog} fullWidth maxWidth="xs">
        <DialogTitle>Update Enrollment Status</DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Parent
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {selectedRequest?.parentName}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Child
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {selectedRequest?.childName}
              </Typography>
            </Box>

            <TextField
              select
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              fullWidth
            >
              {statusOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeStatusDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleStatusUpdate}>
            Save Status
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