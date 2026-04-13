import { useParams } from 'react-router-dom'
import { SessionPage } from '../pages/SessionPage'

export function SessionPageRoute() {
  const { sessionId } = useParams()
  return <SessionPage key={sessionId} />
}
