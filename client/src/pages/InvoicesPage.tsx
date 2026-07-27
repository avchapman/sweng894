import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { isAxiosError } from "axios";
import apiClient from "../api/client";
import { formatCurrency, formatDate } from "../utils/billingFormat";

const invoiceStatuses = ["DRAFT", "SENT", "PAID", "OVERDUE", "VOID"] as const;
type InvoiceStatus = (typeof invoiceStatuses)[number];

type ChildProfile = {
  id: string;
  firstName: string;
  lastName: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  amountCents: number;
  dueDate: string;
  description?: string | null;
  status: InvoiceStatus;
  childProfile: ChildProfile;
};

type InvoiceForm = {
  invoiceNumber: string;
  childProfileId: string;
  amount: string;
  dueDate: string;
  description: string;
  status: InvoiceStatus;
};

const emptyForm: InvoiceForm = {
  invoiceNumber: "",
  childProfileId: "",
  amount: "",
  dueDate: "",
  description: "",
  status: "DRAFT",
};

function getApiError(error: unknown, fallback: string) {
  if (isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<InvoiceForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Invoice | null>(null);
  const [nextStatus, setNextStatus] = useState<InvoiceStatus>("DRAFT");
  const [updating, setUpdating] = useState(false);

  async function loadBillingData() {
    setLoading(true);
    setError("");
    try {
      const [invoiceResponse, childResponse] = await Promise.all([
        apiClient.get("/invoices"),
        apiClient.get("/child-profiles"),
      ]);
      setInvoices(invoiceResponse.data);
      setChildren(childResponse.data);
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to load billing information."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBillingData();
  }, []);

  function openCreateDialog() {
    setError("");
    setForm(emptyForm);
    setCreateOpen(true);
  }

  function openStatusDialog(invoice: Invoice) {
    setError("");
    setStatusTarget(invoice);
    setNextStatus(invoice.status);
  }

  async function createInvoice() {
    if (saving) return;

    const amount = Number(form.amount);
    if (
      !form.invoiceNumber.trim() ||
      !form.childProfileId ||
      !form.dueDate ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError("Invoice number, child, positive amount, and due date are required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await apiClient.post("/invoices", {
        invoiceNumber: form.invoiceNumber.trim(),
        childProfileId: form.childProfileId,
        amountCents: Math.round(amount * 100),
        dueDate: form.dueDate,
        description: form.description.trim(),
        status: form.status,
      });
      setInvoices((current) => [...current, response.data]);
      setCreateOpen(false);
      setForm(emptyForm);
      setSuccess("Invoice created successfully.");
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to create invoice."));
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus() {
    if (!statusTarget || updating) return;

    setUpdating(true);
    setError("");
    try {
      const response = await apiClient.patch(
        `/invoices/${statusTarget.id}/status`,
        { status: nextStatus }
      );
      setInvoices((current) =>
        current.map((invoice) =>
          invoice.id === statusTarget.id ? response.data : invoice
        )
      );
      setStatusTarget(null);
      setSuccess("Invoice status updated successfully.");
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to update invoice status."));
    } finally {
      setUpdating(false);
    }
  }

  const columns = useMemo<GridColDef<Invoice>[]>(
    () => [
      {
        field: "invoiceNumber",
        headerName: "Invoice",
        minWidth: 130,
        flex: 0.8,
      },
      {
        field: "child",
        headerName: "Child",
        minWidth: 170,
        flex: 1,
        valueGetter: (_value, row) =>
          `${row.childProfile.firstName} ${row.childProfile.lastName}`,
      },
      {
        field: "amountCents",
        headerName: "Amount",
        minWidth: 120,
        flex: 0.7,
        valueFormatter: (value) => formatCurrency(Number(value)),
      },
      {
        field: "dueDate",
        headerName: "Due Date",
        minWidth: 150,
        flex: 0.8,
        valueFormatter: (value) => formatDate(String(value)),
      },
      {
        field: "status",
        headerName: "Status",
        minWidth: 120,
        flex: 0.7,
      },
      {
        field: "description",
        headerName: "Description",
        minWidth: 180,
        flex: 1.2,
      },
      {
        field: "actions",
        type: "actions",
        headerName: "Actions",
        width: 100,
        getActions: ({ row }) => [
          <GridActionsCellItem
            key="status"
            icon={<EditOutlinedIcon />}
            label="Update status"
            onClick={() => openStatusDialog(row)}
          />,
        ],
      },
    ],
    []
  );

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography variant="h4">Billing and Invoices</Typography>
          <Typography color="text.secondary">
            Create invoices and track payment status for your organization.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
          Create Invoice
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Stack spacing={1.5} sx={{ py: 10, alignItems: "center" }}>
          <CircularProgress aria-label="Loading invoices" />
          <Typography color="text.secondary">Loading invoices...</Typography>
        </Stack>
      ) : invoices.length === 0 ? (
        <Stack
          spacing={1.5}
          sx={{
            bgcolor: "background.paper",
            borderRadius: 3,
            py: 10,
            alignItems: "center",
          }}
        >
          <ReceiptLongOutlinedIcon color="primary" fontSize="large" />
          <Typography variant="h6">No invoices yet</Typography>
          <Typography color="text.secondary">
            Create the first invoice for an active child profile.
          </Typography>
          <Button variant="outlined" onClick={openCreateDialog}>
            Create Invoice
          </Button>
        </Stack>
      ) : (
        <Box sx={{ height: 560, bgcolor: "background.paper", borderRadius: 3 }}>
          <DataGrid
            rows={invoices}
            columns={columns}
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10, page: 0 } },
            }}
          />
        </Box>
      )}

      <Dialog open={createOpen} onClose={saving ? undefined : () => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Invoice</DialogTitle>
        <DialogContent>
          <Stack spacing={2.25} sx={{ pt: 1 }}>
            <TextField
              required
              label="Invoice number"
              value={form.invoiceNumber}
              onChange={(event) =>
                setForm((current) => ({ ...current, invoiceNumber: event.target.value }))
              }
            />
            <FormControl required>
              <InputLabel id="invoice-child-label">Child</InputLabel>
              <Select
                labelId="invoice-child-label"
                label="Child"
                value={form.childProfileId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, childProfileId: event.target.value }))
                }
              >
                {children.map((child) => (
                  <MenuItem key={child.id} value={child.id}>
                    {child.firstName} {child.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              required
              label="Amount"
              type="number"
              value={form.amount}
              onChange={(event) =>
                setForm((current) => ({ ...current, amount: event.target.value }))
              }
              slotProps={{ htmlInput: { min: "0.01", step: "0.01" } }}
            />
            <TextField
              required
              label="Due date"
              type="date"
              value={form.dueDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, dueDate: event.target.value }))
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControl>
              <InputLabel id="invoice-status-label">Initial status</InputLabel>
              <Select
                labelId="invoice-status-label"
                label="Initial status"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as InvoiceStatus,
                  }))
                }
              >
                {invoiceStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Description"
              multiline
              minRows={3}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" disabled={saving} onClick={createInvoice}>
            {saving ? "Creating..." : "Create Invoice"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(statusTarget)} onClose={updating ? undefined : () => setStatusTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Update Invoice Status</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography>
              {statusTarget?.invoiceNumber} for {statusTarget?.childProfile.firstName}{" "}
              {statusTarget?.childProfile.lastName}
            </Typography>
            <FormControl>
              <InputLabel id="update-status-label">Status</InputLabel>
              <Select
                labelId="update-status-label"
                label="Status"
                value={nextStatus}
                onChange={(event) => setNextStatus(event.target.value as InvoiceStatus)}
              >
                {invoiceStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={updating} onClick={() => setStatusTarget(null)}>
            Cancel
          </Button>
          <Button variant="contained" disabled={updating} onClick={updateStatus}>
            {updating ? "Updating..." : "Update Status"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={4000}
        onClose={() => setSuccess("")}
        message={success}
      />
    </Stack>
  );
}
