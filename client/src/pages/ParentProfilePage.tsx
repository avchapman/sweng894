import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import apiClient from "../api/client";

type LinkedChild = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  notes: string | null;
  organization: { name: string };
};

export default function ParentProfilePage() {
  const [children, setChildren] = useState<LinkedChild[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadChildren() {
      try {
        const response = await apiClient.get<LinkedChild[]>("/parent/children");
        setChildren(response.data);
        setSelectedId(response.data[0]?.id ?? "");
      } catch {
        setError("Unable to load linked child information.");
      } finally {
        setLoading(false);
      }
    }

    void loadChildren();
  }, []);

  const child = children.find((item) => item.id === selectedId);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">My Child&apos;s Profile</Typography>
        <Typography color="text.secondary">
          Information for your linked child.
        </Typography>
      </Box>

      {loading && (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <CircularProgress size={24} />
          <Typography>Loading child information…</Typography>
        </Stack>
      )}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && children.length === 0 && (
        <Alert severity="info">
          No child profile is linked to this parent account. Contact your
          organization for assistance.
        </Alert>
      )}

      {children.length > 1 && (
        <FormControl sx={{ maxWidth: 360 }}>
          <InputLabel id="linked-child-label">Child</InputLabel>
          <Select
            labelId="linked-child-label"
            label="Child"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {children.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.firstName} {item.lastName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {child && (
        <Card>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Stack spacing={4}>
              <Stack direction="row" spacing={3} sx={{ alignItems: "center" }}>
                <Avatar
                  sx={{ width: 96, height: 96, bgcolor: "primary.main", fontSize: 30 }}
                >
                  {child.firstName[0]}
                  {child.lastName[0]}
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {child.firstName} {child.lastName}
                  </Typography>
                  <Typography color="text.secondary">
                    Date of birth:{" "}
                    {child.dateOfBirth
                      ? new Date(child.dateOfBirth).toLocaleDateString()
                      : "Not provided"}
                  </Typography>
                </Box>
              </Stack>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Profile Information
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography>{child.notes || "No notes provided"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Organization
                    </Typography>
                    <Typography>{child.organization.name}</Typography>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
