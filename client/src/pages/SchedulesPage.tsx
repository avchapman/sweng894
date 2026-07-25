import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import apiClient from "../api/client";

type ChildProfile = {
  id: string;
  firstName: string;
  lastName: string;
};

type ScheduleAssignment = {
  childProfile: ChildProfile;
};

type ScheduleEntry = {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  location?: string | null;
  assignments: ScheduleAssignment[];
};

type ScheduleFormData = {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  childProfileIds: string[];
};

const emptyForm: ScheduleFormData = {
  title: "",
  description: "",
  startTime: "",
  endTime: "",
  location: "",
  childProfileIds: [],
};

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatScheduleDate(startTime: string, endTime: string) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  return `${start.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  })}, ${start.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}–${end.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export default function SchedulesPage() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleEntry | null>(null);
  const [formData, setFormData] = useState<ScheduleFormData>(emptyForm);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [scheduleResponse, childrenResponse] = await Promise.all([
        apiClient.get("/schedules"),
        apiClient.get("/child-profiles"),
      ]);
      setEntries(scheduleResponse.data);
      setChildren(childrenResponse.data);
    } catch {
      setError("Unable to load schedules.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, []);

  function openCreateDialog() {
    setSelectedEntry(null);
    setFormData(emptyForm);
    setFormError("");
    setDialogOpen(true);
  }

  function openEditDialog(entry: ScheduleEntry) {
    setSelectedEntry(entry);
    setFormData({
      title: entry.title,
      description: entry.description || "",
      startTime: toDateTimeLocal(entry.startTime),
      endTime: toDateTimeLocal(entry.endTime),
      location: entry.location || "",
      childProfileIds: entry.assignments.map(
        (assignment) => assignment.childProfile.id
      ),
    });
    setFormError("");
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setSelectedEntry(null);
    setFormData(emptyForm);
    setFormError("");
  }

  async function handleSubmit() {
    if (saving) return;
    if (!formData.title || !formData.startTime || !formData.endTime) {
      setFormError("Title, start time, and end time are required.");
      return;
    }

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    if (end <= start) {
      setFormError("End time must be after start time.");
      return;
    }

    const payload = {
      ...formData,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };

    setSaving(true);
    setFormError("");
    setError("");
    try {
      if (selectedEntry) {
        const response = await apiClient.put(
          `/schedules/${selectedEntry.id}`,
          payload
        );
        setEntries((current) =>
          current
            .map((entry) =>
              entry.id === selectedEntry.id ? response.data : entry
            )
            .sort(
              (left, right) =>
                new Date(left.startTime).getTime() -
                new Date(right.startTime).getTime()
            )
        );
        setSuccessMessage("Schedule entry updated successfully.");
      } else {
        const response = await apiClient.post("/schedules", payload);
        setEntries((current) =>
          [...current, response.data].sort(
            (left, right) =>
              new Date(left.startTime).getTime() -
              new Date(right.startTime).getTime()
          )
        );
        setSuccessMessage("Schedule entry created successfully.");
      }
      closeDialog();
    } catch {
      setFormError("Unable to save the schedule entry.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    setError("");
    try {
      await apiClient.delete(`/schedules/${deleteTarget.id}`);
      setEntries((current) =>
        current.filter((entry) => entry.id !== deleteTarget.id)
      );
      setDeleteTarget(null);
      setSuccessMessage("Schedule entry deleted successfully.");
    } catch {
      setError("Unable to delete the schedule entry.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4">Schedules</Typography>
          <Typography color="text.secondary">
            Create calendar entries and assign them to child profiles.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          Add Schedule Entry
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {loading && (
        <Stack spacing={1.5} sx={{ py: 6, alignItems: "center" }}>
          <CircularProgress aria-label="Loading schedules" />
          <Typography color="text.secondary">Loading schedules…</Typography>
        </Stack>
      )}

      {!loading && entries.length === 0 && (
        <Card>
          <CardContent>
            <Stack spacing={1.5} sx={{ alignItems: "center", py: 5 }}>
              <CalendarMonthIcon color="primary" sx={{ fontSize: 42 }} />
              <Typography variant="h6">No schedule entries yet</Typography>
              <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                Create the first class, session, or organization event.
              </Typography>
              <Button variant="outlined" onClick={openCreateDialog}>
                Add Schedule Entry
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {!loading && (
        <Stack spacing={2}>
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="h6">{entry.title}</Typography>
                      <Typography color="text.secondary">
                        {formatScheduleDate(entry.startTime, entry.endTime)}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${entry.assignments.length} ${
                        entry.assignments.length === 1 ? "child" : "children"
                      }`}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>

                  {entry.location && (
                    <Stack
                      direction="row"
                      spacing={0.75}
                      sx={{ alignItems: "center" }}
                    >
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="body2">{entry.location}</Typography>
                    </Stack>
                  )}

                  {entry.description && (
                    <Typography>{entry.description}</Typography>
                  )}

                  {entry.assignments.length > 0 && (
                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      sx={{ flexWrap: "wrap" }}
                    >
                      {entry.assignments.map(({ childProfile }) => (
                        <Chip
                          key={childProfile.id}
                          size="small"
                          label={`${childProfile.firstName} ${childProfile.lastName}`}
                        />
                      ))}
                    </Stack>
                  )}
                </Stack>
              </CardContent>
              <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => openEditDialog(entry)}
                >
                  Edit
                </Button>
                <Button
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteTarget(entry)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog
        open={dialogOpen}
        onClose={saving ? undefined : closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {selectedEntry ? "Edit Schedule Entry" : "Add Schedule Entry"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Title"
              value={formData.title}
              onChange={(event) =>
                setFormData({ ...formData, title: event.target.value })
              }
              required
              fullWidth
              disabled={saving}
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField
                label="Start Time"
                type="datetime-local"
                value={formData.startTime}
                onChange={(event) =>
                  setFormData({ ...formData, startTime: event.target.value })
                }
                required
                disabled={saving}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="End Time"
                type="datetime-local"
                value={formData.endTime}
                onChange={(event) =>
                  setFormData({ ...formData, endTime: event.target.value })
                }
                required
                disabled={saving}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
            <TextField
              label="Location"
              value={formData.location}
              onChange={(event) =>
                setFormData({ ...formData, location: event.target.value })
              }
              fullWidth
              disabled={saving}
            />
            <FormControl fullWidth disabled={saving}>
              <InputLabel id="schedule-child-label">Assign Children</InputLabel>
              <Select
                labelId="schedule-child-label"
                multiple
                value={formData.childProfileIds}
                label="Assign Children"
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    childProfileIds:
                      typeof event.target.value === "string"
                        ? event.target.value.split(",")
                        : event.target.value,
                  })
                }
                renderValue={(selected) =>
                  selected
                    .map((id) => {
                      const child = children.find((item) => item.id === id);
                      return child
                        ? `${child.firstName} ${child.lastName}`
                        : id;
                    })
                    .join(", ")
                }
              >
                {children.map((child) => (
                  <MenuItem key={child.id} value={child.id}>
                    <Checkbox
                      checked={formData.childProfileIds.includes(child.id)}
                    />
                    <ListItemText
                      primary={`${child.firstName} ${child.lastName}`}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Description"
              value={formData.description}
              onChange={(event) =>
                setFormData({ ...formData, description: event.target.value })
              }
              fullWidth
              multiline
              minRows={3}
              disabled={saving}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeDialog} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            startIcon={
              saving ? <CircularProgress size={18} color="inherit" /> : undefined
            }
          >
            {selectedEntry ? "Save Changes" : "Create Entry"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={deleting ? undefined : () => setDeleteTarget(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete schedule entry?</DialogTitle>
        <DialogContent>
          <Typography>
            {deleteTarget?.title} will be permanently removed from the
            organization schedule.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={
              deleting ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <DeleteIcon />
              )
            }
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage("")}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccessMessage("")}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
