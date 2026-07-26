import { Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LogoutIcon from "@mui/icons-material/Logout";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { useAuth } from "../context/AuthContext";

const drawerWidth = 260;

const staffNavItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <DashboardIcon />,
  },
  {
    label: "Child Profiles",
    path: "/child-profiles",
    icon: <ChildCareIcon />,
  },
  {
    label: "Enrollment",
    path: "/enrollment",
    icon: <AssignmentIcon />,
  },
  {
    label: "Schedules",
    path: "/schedules",
    icon: <CalendarMonthIcon />,
  },
  {
    label: "Messages",
    path: "/messages",
    icon: <EmailOutlinedIcon />,
  },
];

export default function AppLayout() {
  const { token, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isParent = user?.role === "PARENT";
  const navItems = isParent
    ? [
        {
          label: "Child Profile",
          path: "/my-child",
          icon: <ChildCareIcon />,
        },
        {
          label: "Schedule",
          path: "/my-schedule",
          icon: <CalendarMonthIcon />,
        },
      ]
    : staffNavItems;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6">BrightPath Dashboard</Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ bgcolor: "primary.main" }}>
              {user?.firstName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }} >
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.role}
              </Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "0",
            bgcolor: "#111827",
            color: "white",
          },
        }}
      >
        <Toolbar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                   BrightPath
            </Typography>
            <Typography
                 variant="body2"
                 sx={{
                     color: "rgba(255,255,255,.7)",
                  }}
             >
                 Childcare Management
             </Typography>
            <Typography
                variant="caption"
                sx={{
                       color: "#c7d2fe",
                   }}
              >
                 {user?.organizationName}
             </Typography>
          </Box>
        </Toolbar>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

        <List sx={{ px: 1.5, py: 2 }}>
          {navItems.map((item) => {
            const selected = location.pathname === item.path;

            return (
              <ListItemButton
                key={item.path}
                selected={selected}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  color: "white",
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "white",
                  },
                  "&.Mui-selected:hover": {
                    bgcolor: "primary.main",
                  },
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>

        <Box sx={{ mt: "auto", p: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ borderColor: "rgba(255,255,255,0.32)" }}
          >
            Logout
          </Button>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 4, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
