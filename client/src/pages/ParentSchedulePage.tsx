import { useEffect, useMemo, useState } from "react";
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
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import apiClient from "../api/client";

type ScheduleEntry = {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  location: string | null;
  assignments: Array<{
    childProfile: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
};

export default function ParentSchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSchedules() {
      try {
        const response = await apiClient.get<ScheduleEntry[]>(
          "/parent/schedules"
        );
        setSchedules(response.data);
      } catch {
        setError("Unable to load your child's schedule.");
      } finally {
        setLoading(false);
      }
    }

    void loadSchedules();
  }, []);

  const childNames = useMemo(
    () =>
      Array.from(
        new Set(
          schedules.flatMap((schedule) =>
            schedule.assignments.map(
              ({ childProfile }) =>
                `${childProfile.firstName} ${childProfile.lastName}`
            )
          )
        )
      ),
    [schedules]
  );

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">My Child&apos;s Schedule</Typography>
        <Typography color="text.secondary">
          Upcoming events{childNames.length ? ` for ${childNames.join(", ")}` : ""}.
        </Typography>
      </Box>

      {loading && (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <CircularProgress size={24} />
          <Typography>Loading schedule…</Typography>
        </Stack>
      )}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && schedules.length === 0 && (
        <Card>
          <CardContent>
            <Stack spacing={1.5} sx={{ py: 6, alignItems: "center" }}>
              <CalendarMonthIcon color="primary" fontSize="large" />
              <Typography variant="h6">No upcoming events</Typography>
              <Typography color="text.secondary">
                Assigned classes, sessions, and organization events will appear
                here.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {schedules.map((schedule) => {
        const start = new Date(schedule.startTime);
        const end = new Date(schedule.endTime);
        return (
          <Card key={schedule.id}>
            <CardContent>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={3}
                sx={{ alignItems: { sm: "center" } }}
              >
                <Box
                  sx={{
                    minWidth: 92,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "primary.50",
                    textAlign: "center",
                  }}
                >
                  <Typography color="primary" sx={{ fontWeight: 700 }}>
                    {start
                      .toLocaleDateString(undefined, {
                        weekday: "short",
                        day: "2-digit",
                      })
                      .toUpperCase()}
                  </Typography>
                </Box>
                <Stack spacing={0.75} sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">{schedule.title}</Typography>
                  <Typography color="text.secondary">
                    {start.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {" – "}
                    {end.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {schedule.location ? ` | ${schedule.location}` : ""}
                  </Typography>
                  {schedule.description && (
                    <Typography>{schedule.description}</Typography>
                  )}
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    {schedule.assignments.map(({ childProfile }) => (
                      <Chip
                        key={childProfile.id}
                        size="small"
                        label={`${childProfile.firstName} ${childProfile.lastName}`}
                      />
                    ))}
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}
