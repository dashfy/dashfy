import { WebSocketStatus } from '@dashfy/types'

import {
  CheckCircle2Icon,
  CircleDashedIcon,
  CircleXIcon,
  RefreshCwIcon,
  WifiOffIcon,
} from '@/components/common/Icons'

export interface StatusConfig {
  icon: React.ReactNode
  iconColor: string
  bgColor: string
  label: string
  description: string
  pulse?: boolean
}

export const connectionStatusConfig: Record<WebSocketStatus, StatusConfig> = {
  [WebSocketStatus.CONNECTED]: {
    icon: <CheckCircle2Icon className="h-5 w-5" />,
    iconColor: 'text-success',
    bgColor: 'bg-success',
    label: 'Connected',
    description: 'WebSocket connection is active and healthy',
    pulse: true,
  },
  [WebSocketStatus.CONNECTING]: {
    icon: <CircleDashedIcon className="h-5 w-5 animate-spin" />,
    iconColor: 'text-warning',
    bgColor: 'bg-warning',
    label: 'Connecting',
    description: 'Establishing WebSocket connection...',
    pulse: true,
  },
  [WebSocketStatus.DISCONNECTED]: {
    icon: <WifiOffIcon className="h-5 w-5" />,
    iconColor: 'text-muted-foreground',
    bgColor: 'bg-muted-foreground',
    label: 'Disconnected',
    description: 'WebSocket connection is closed',
    pulse: false,
  },
  [WebSocketStatus.RECONNECTING]: {
    icon: <RefreshCwIcon className="h-5 w-5 animate-spin" />,
    iconColor: 'text-warning',
    bgColor: 'bg-warning',
    label: 'Reconnecting',
    description: 'Attempting to reconnect to WebSocket server...',
    pulse: true,
  },
  [WebSocketStatus.ERROR]: {
    icon: <CircleXIcon className="h-5 w-5" />,
    iconColor: 'text-error',
    bgColor: 'bg-error',
    label: 'Error',
    description: 'WebSocket connection encountered an error',
    pulse: false,
  },
}
