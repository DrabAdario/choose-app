import { createHashRouter } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { SessionPageRoute } from './components/SessionPageRoute'
import { HubPage } from './pages/HubPage'
import { JoinPage } from './pages/JoinPage'

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HubPage /> },
      { path: 'join', element: <JoinPage /> },
      { path: 'session/:sessionId', element: <SessionPageRoute /> },
    ],
  },
])
