import { createHashRouter } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { HubPage } from './pages/HubPage'
import { JoinPage } from './pages/JoinPage'
import { SessionPage } from './pages/SessionPage'

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HubPage /> },
      { path: 'join', element: <JoinPage /> },
      { path: 'session/:sessionId', element: <SessionPage /> },
    ],
  },
])
