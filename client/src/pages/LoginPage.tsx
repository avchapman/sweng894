import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password.");
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background:
          "radial-gradient(circle at top left, #dfe7ff, transparent 34%), linear-gradient(135deg, #f7f8ff 0%, #eef7f6 100%)",
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ boxShadow: "0 24px 80px rgba(31, 41, 55, 0.16)" }}>
          <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
            <Stack spacing={3}>
              <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center" }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "18px",
                    bgcolor: "primary.main",
                    color: "white",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <FamilyRestroomIcon sx={{ fontSize: 34 }} />
                </Box>

                <Typography variant="h4">
                    BrightPath
                </Typography>
                <Typography color="text.secondary">
                    Childcare Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Welcome back! Sign in to continue.
                </Typography>
              </Stack>

              {error && <Alert severity="error">{error}</Alert>}

              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    fullWidth
                  />

                  <TextField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    fullWidth
                  />

                  <Button type="submit" variant="contained" size="large">
                    Log In
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}