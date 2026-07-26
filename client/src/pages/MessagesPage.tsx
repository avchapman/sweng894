import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SendIcon from "@mui/icons-material/Send";
import apiClient from "../api/client";

type Recipient = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  childLinks: Array<{
    childProfile: { id: string; firstName: string; lastName: string };
  }>;
};

export default function MessagesPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("friendly");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadRecipients() {
      try {
        const response = await apiClient.get<Recipient[]>("/messages/recipients");
        setRecipients(response.data);
      } catch {
        setError("Unable to load parent recipients.");
      } finally {
        setLoading(false);
      }
    }
    void loadRecipients();
  }, []);

  const selectedRecipients = useMemo(
    () => recipients.filter((recipient) => recipientIds.includes(recipient.id)),
    [recipientIds, recipients]
  );

  async function generateDraft() {
    setGenerating(true);
    setError("");
    setSuccess("");
    try {
      const response = await apiClient.post("/messages/ai-draft", {
        topic,
        tone,
        details,
      });
      setSubject(response.data.subject);
      setBody(response.data.body);
      setSuccess("Draft generated. Review and edit it before sending.");
    } catch (requestError: unknown) {
      const message =
        requestError &&
        typeof requestError === "object" &&
        "response" in requestError
          ? (requestError as { response?: { data?: { message?: string } } })
              .response?.data?.message
          : undefined;
      setError(message || "Unable to generate a message draft.");
    } finally {
      setGenerating(false);
    }
  }

  function openReview() {
    setError("");
    if (!recipientIds.length || !subject.trim() || !body.trim()) {
      setError("Select recipients and enter a subject and message.");
      return;
    }
    setReviewOpen(true);
  }

  async function sendMessage() {
    setSending(true);
    setError("");
    try {
      await apiClient.post("/messages", { recipientIds, subject, body });
      setReviewOpen(false);
      setRecipientIds([]);
      setSubject("");
      setBody("");
      setTopic("");
      setDetails("");
      setSuccess("Message sent successfully.");
    } catch (requestError: unknown) {
      const message =
        requestError &&
        typeof requestError === "object" &&
        "response" in requestError
          ? (requestError as { response?: { data?: { message?: string } } })
              .response?.data?.message
          : undefined;
      setError(message || "Unable to send the message.");
      setReviewOpen(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Messages</Typography>
        <Typography color="text.secondary">
          Compose and review messages before sending them to families.
        </Typography>
      </Box>

      {loading && (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <CircularProgress size={24} />
          <Typography>Loading recipients…</Typography>
        </Stack>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Stack direction={{ xs: "column", lg: "row" }} spacing={3}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <AutoAwesomeIcon color="primary" />
                <Typography variant="h6">AI Message Assistant</Typography>
              </Stack>
              <Typography color="text.secondary">
                Generate an editable starting point. Drafts are never sent
                automatically.
              </Typography>
              <TextField
                label="Topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Weather closure"
              />
              <FormControl>
                <InputLabel id="tone-label">Tone</InputLabel>
                <Select
                  labelId="tone-label"
                  label="Tone"
                  value={tone}
                  onChange={(event) => setTone(event.target.value)}
                >
                  <MenuItem value="friendly">Friendly</MenuItem>
                  <MenuItem value="formal">Formal</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Important details"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                multiline
                minRows={3}
              />
              <Button
                variant="outlined"
                startIcon={
                  generating ? <CircularProgress size={18} /> : <AutoAwesomeIcon />
                }
                onClick={generateDraft}
                disabled={generating || !topic.trim()}
              >
                Generate Draft
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 2 }}>
          <CardContent>
            <Stack spacing={2.5}>
              <Typography variant="h6">Compose Message</Typography>
              <FormControl>
                <InputLabel id="recipients-label">Recipients</InputLabel>
                <Select
                  labelId="recipients-label"
                  label="Recipients"
                  multiple
                  value={recipientIds}
                  onChange={(event) =>
                    setRecipientIds(
                      typeof event.target.value === "string"
                        ? event.target.value.split(",")
                        : event.target.value
                    )
                  }
                  renderValue={(selected) => (
                    <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
                      {recipients
                        .filter((recipient) => selected.includes(recipient.id))
                        .map((recipient) => (
                          <Chip
                            key={recipient.id}
                            size="small"
                            label={`${recipient.firstName} ${recipient.lastName}`}
                          />
                        ))}
                    </Stack>
                  )}
                >
                  {recipients.map((recipient) => (
                    <MenuItem key={recipient.id} value={recipient.id}>
                      {recipient.firstName} {recipient.lastName} —{" "}
                      {recipient.childLinks
                        .map(
                          ({ childProfile }) =>
                            `${childProfile.firstName} ${childProfile.lastName}`
                        )
                        .join(", ") || "No linked child"}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />
              <TextField
                label="Message"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                multiline
                minRows={10}
                helperText="AI-assisted content remains fully editable."
              />
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={openReview}
                disabled={sending || loading || recipients.length === 0}
              >
                Review Message
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Dialog
        open={reviewOpen}
        onClose={() => !sending && setReviewOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Review message before sending</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Recipients
              </Typography>
              <Typography>
                {selectedRecipients
                  .map(({ firstName, lastName }) => `${firstName} ${lastName}`)
                  .join(", ")}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Subject
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>{subject}</Typography>
            </Box>
            <Typography sx={{ whiteSpace: "pre-wrap" }}>{body}</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewOpen(false)} disabled={sending}>
            Continue Editing
          </Button>
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={sending}
            startIcon={sending ? <CircularProgress size={18} /> : <SendIcon />}
          >
            Send Message
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
