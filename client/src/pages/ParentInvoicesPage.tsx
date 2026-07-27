import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import apiClient from "../api/client";

type ParentInvoice = {
  id: string;
  invoiceNumber: string;
  amountCents: number;
  dueDate: string;
  description?: string | null;
  status: "SENT" | "PAID" | "OVERDUE" | "VOID";
  childProfile: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function statusColor(status: ParentInvoice["status"]) {
  if (status === "PAID") return "success";
  if (status === "OVERDUE") return "error";
  if (status === "SENT") return "info";
  return "default";
}

export default function ParentInvoicesPage() {
  const [invoices, setInvoices] = useState<ParentInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInvoices() {
      setLoading(true);
      setError("");
      try {
        const response = await apiClient.get("/parent/invoices");
        setInvoices(response.data);
      } catch {
        setError("Unable to load invoices. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    void loadInvoices();
  }, []);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">My Invoices</Typography>
        <Typography color="text.secondary">
          View invoice amounts, due dates, and payment status for your linked children.
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Stack spacing={1.5} sx={{ py: 10, alignItems: "center" }}>
          <CircularProgress aria-label="Loading parent invoices" />
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
          <Typography variant="h6">No invoices to display</Typography>
          <Typography color="text.secondary">
            New invoices will appear here after they are sent by your childcare organization.
          </Typography>
        </Stack>
      ) : (
        <Stack spacing={2}>
          {invoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardContent>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  sx={{ justifyContent: "space-between" }}
                >
                  <Stack spacing={0.75}>
                    <Typography variant="h6">{invoice.invoiceNumber}</Typography>
                    <Typography color="text.secondary">
                      {invoice.childProfile.firstName} {invoice.childProfile.lastName}
                    </Typography>
                    {invoice.description && <Typography>{invoice.description}</Typography>}
                  </Stack>
                  <Stack
                    direction={{ xs: "row", md: "column" }}
                    spacing={0.75}
                    sx={{
                      alignItems: { xs: "center", md: "flex-end" },
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="h5">
                      {formatCurrency(invoice.amountCents)}
                    </Typography>
                    <Typography color="text.secondary">
                      Due {formatDate(invoice.dueDate)}
                    </Typography>
                    <Chip
                      label={invoice.status}
                      color={statusColor(invoice.status)}
                      size="small"
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
