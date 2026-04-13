import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material'
import { Link as RouterLink, Outlet } from 'react-router-dom'

export function AppShell() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 52 }}>
          <Typography
            component={RouterLink}
            to="/"
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              textDecoration: 'none',
              letterSpacing: '-0.02em',
              '&:hover': { color: 'primary.main' },
            }}
          >
            Choose
          </Typography>
        </Toolbar>
      </AppBar>
      <Container
        component="main"
        maxWidth="sm"
        sx={{ flex: 1, py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}
      >
        <Outlet />
      </Container>
    </Box>
  )
}
