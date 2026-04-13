import { useParams } from 'react-router-dom'
import { WheelPage } from '../pages/WheelPage'

export function WheelPageRoute() {
  const { sessionId } = useParams()
  return <WheelPage key={sessionId} />
}
