import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
  Button,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BusinessIcon from "@mui/icons-material/Business";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../utils/billingFormat";

type ChildProfile = {
  id: string;
};

type EnrollmentRequest = {
  id: string;
  status: string;
};

type BillingMetrics = {
  invoiceCount: number;
  paidCents: number;
  outstandingCents: number;
  overdueCount: number;
};

const emptyBillingMetrics: BillingMetrics = {
  invoiceCount: 0,
  paidCents: 0,
  outstandingCents: 0,
  overdueCount: 0,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [enrollmentRequests, setEnrollmentRequests] = useState<
    EnrollmentRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [billingMetrics, setBillingMetrics] =
    useState<BillingMetrics>(emptyBillingMetrics);

  async function loadDashboardData() {
    setLoading(true);
    setError("");

    try {
      const [childrenResponse, enrollmentResponse, billingResponse] = await Promise.all([
        apiClient.get("/child-profiles"),
        apiClient.get("/enrollment"),
        apiClient.get("/invoices/metrics"),
      ]);

      setChildren(childrenResponse.data);
      setEnrollmentRequests(enrollmentResponse.data);
      setBillingMetrics(billingResponse.data);
    } catch {
      setError("Unable to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDashboardData();
  }, []);

  const newRequestsCount = useMemo(
    () => enrollmentRequests.filter((request) => request.status === "NEW").length,
    [enrollmentRequests]
  );

  const contactedRequestsCount = useMemo(
    () =>
      enrollmentRequests.filter((request) => request.status === "CONTACTED")
        .length,
    [enrollmentRequests]
  );

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Dashboard</Typography>
        <Typography color="text.secondary">
          Welcome back, {user?.firstName}. Manage your childcare organization
          from one place.
        </Typography>
      </Box>

      {loading && <LinearProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <ChildCareIcon color="primary" />
                <Typography variant="h6">Child Profiles</Typography>
                <Typography variant="h4">{children.length}</Typography>
                <Typography color="text.secondary">
                  Active child records
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate("/child-profiles")}
                >
                  Manage Profiles
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <AssignmentIcon color="primary" />
                <Typography variant="h6">Enrollment</Typography>
                <Typography variant="h4">
                  {enrollmentRequests.length}
                </Typography>
                <Typography color="text.secondary">
                  Total inquiries
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate("/enrollment")}
                >
                  View Requests
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <PendingActionsIcon color="warning" />
                <Typography variant="h6">New Requests</Typography>
                <Typography variant="h4">{newRequestsCount}</Typography>
                <Typography color="text.secondary">
                  Awaiting follow-up
                </Typography>
                <Chip
                  label="Needs review"
                  color={newRequestsCount > 0 ? "warning" : "default"}
                  sx={{ width: "fit-content" }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <CheckCircleIcon color="success" />
                <Typography variant="h6">Contacted</Typography>
                <Typography variant="h4">{contactedRequestsCount}</Typography>
                <Typography color="text.secondary">
                  Follow-up started
                </Typography>
                <Chip
                  label="In progress"
                  color="success"
                  sx={{ width: "fit-content" }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <BusinessIcon color="secondary" />
                <Typography variant="h6">Organization</Typography>
                <Typography color="text.secondary">
                  {user?.organizationName}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <AdminPanelSettingsIcon color="secondary" />
                <Typography variant="h6">Access Role</Typography>
                <Chip
                  label={user?.role}
                  color="primary"
                  sx={{ width: "fit-content" }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box>
        <Typography variant="h5">Billing Overview</Typography>
        <Typography color="text.secondary">
          Current invoice activity for your organization.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <ReceiptLongOutlinedIcon color="primary" />
                <Typography variant="h6">Active Invoices</Typography>
                <Typography variant="h4">{billingMetrics.invoiceCount}</Typography>
                <Button variant="outlined" onClick={() => navigate("/invoices")}>
                  View Billing
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <PaidOutlinedIcon color="success" />
                <Typography variant="h6">Paid</Typography>
                <Typography variant="h4">
                  {formatCurrency(billingMetrics.paidCents)}
                </Typography>
                <Typography color="text.secondary">Collected payments</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <AccountBalanceWalletOutlinedIcon color="warning" />
                <Typography variant="h6">Outstanding</Typography>
                <Typography variant="h4">
                  {formatCurrency(billingMetrics.outstandingCents)}
                </Typography>
                <Typography color="text.secondary">Unpaid balance</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <ReportProblemOutlinedIcon color="error" />
                <Typography variant="h6">Overdue</Typography>
                <Typography variant="h4">{billingMetrics.overdueCount}</Typography>
                <Typography color="text.secondary">Invoices requiring follow-up</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
