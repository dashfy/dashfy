import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  ActivityIcon,
  CheckCircle2Icon,
  ClockIcon,
  ServerIcon,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react'

import { Widget } from '../components/widget/base/Widget'
import { WidgetBody } from '../components/widget/base/WidgetBody'
import { WidgetHeader } from '../components/widget/base/WidgetHeader'
import { WidgetCounter } from '../components/widget/display/WidgetCounter'
import { WidgetListItem } from '../components/widget/list/WidgetListItem'
import { WidgetStatusBadge } from '../components/widget/status/WidgetStatusBadge'
import { WidgetStatusChip } from '../components/widget/status/WidgetStatusChip'
import { WidgetTable } from '../components/widget/table/WidgetTable'
import { WidgetTableCell } from '../components/widget/table/WidgetTableCell'
import { WidgetTableHeadCell } from '../components/widget/table/WidgetTableHeadCell'

const meta = {
  title: 'Examples/Complete Dashboard',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const FullDashboard: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground">Monitor your system in real-time</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Counter Widgets */}
        <div className="h-[200px]">
          <Widget>
            <WidgetHeader icon={<UsersIcon className="h-5 w-5" />} title="Active Users" />
            <WidgetCounter align="center" count={123} unit="users" />
          </Widget>
        </div>

        <div className="h-[200px]">
          <Widget>
            <WidgetHeader icon={<TrendingUpIcon className="h-5 w-5" />} title="Revenue" />
            <WidgetCounter align="center" count={9850} postLabel="This month" unit="$" />
          </Widget>
        </div>

        <div className="h-[200px]">
          <Widget>
            <WidgetHeader icon={<CheckCircle2Icon className="h-5 w-5" />} title="Tasks" />
            <WidgetCounter align="center" count={87} postLabel="Completed" unit="%" />
          </Widget>
        </div>

        <div className="h-[200px]">
          <Widget>
            <WidgetHeader icon={<ClockIcon className="h-5 w-5" />} title="Response Time" />
            <WidgetCounter align="center" count={125} preLabel="Average" unit="ms" />
          </Widget>
        </div>

        {/* System Status */}
        <div className="h-[300px] md:col-span-2">
          <Widget>
            <WidgetHeader icon={<ServerIcon className="h-5 w-5" />} title="System Status" />
            <WidgetBody>
              <div className="grid h-full grid-cols-2 gap-4">
                <WidgetStatusBadge label="API Online" size="md" status="success" />
                <WidgetStatusBadge label="Database" size="md" status="success" />
                <WidgetStatusBadge label="Cache" size="md" status="warning" />
                <WidgetStatusBadge label="Queue" size="md" status="error" />
              </div>
            </WidgetBody>
          </Widget>
        </div>

        {/* Activity Feed */}
        <div className="h-[300px] md:col-span-2">
          <Widget>
            <WidgetHeader icon={<ActivityIcon className="h-5 w-5" />} title="Recent Activity" />
            <div className="overflow-auto">
              <WidgetListItem
                icon={<UsersIcon className="h-4 w-4" />}
                meta="2 minutes ago"
                title="New user registered"
              />
              <WidgetListItem
                icon={<CheckCircle2Icon className="h-4 w-4" />}
                meta="15 minutes ago"
                title="Deployment completed"
                value="v2.1.0"
              />
              <WidgetListItem
                icon={<ClockIcon className="h-4 w-4" />}
                meta="1 hour ago"
                title="Backup completed"
              />
              <WidgetListItem
                icon={<ServerIcon className="h-4 w-4" />}
                meta="3 hours ago"
                title="Server restarted"
              />
            </div>
          </Widget>
        </div>

        {/* Server Status Table */}
        <div className="h-[300px] md:col-span-2 lg:col-span-4">
          <Widget>
            <WidgetHeader title="Server Status" />
            <WidgetTable>
              <thead>
                <tr>
                  <WidgetTableHeadCell>Server</WidgetTableHeadCell>
                  <WidgetTableHeadCell>Region</WidgetTableHeadCell>
                  <WidgetTableHeadCell>Status</WidgetTableHeadCell>
                  <WidgetTableHeadCell align="right">CPU</WidgetTableHeadCell>
                  <WidgetTableHeadCell align="right">Memory</WidgetTableHeadCell>
                  <WidgetTableHeadCell align="right">Uptime</WidgetTableHeadCell>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <WidgetTableCell>api-01</WidgetTableCell>
                  <WidgetTableCell>US-East</WidgetTableCell>
                  <WidgetTableCell>
                    <WidgetStatusChip label="Running" status="success" />
                  </WidgetTableCell>
                  <WidgetTableCell align="right">45%</WidgetTableCell>
                  <WidgetTableCell align="right">62%</WidgetTableCell>
                  <WidgetTableCell align="right">99.9%</WidgetTableCell>
                </tr>
                <tr>
                  <WidgetTableCell>api-02</WidgetTableCell>
                  <WidgetTableCell>US-West</WidgetTableCell>
                  <WidgetTableCell>
                    <WidgetStatusChip label="Warning" status="warning" />
                  </WidgetTableCell>
                  <WidgetTableCell align="right">78%</WidgetTableCell>
                  <WidgetTableCell align="right">85%</WidgetTableCell>
                  <WidgetTableCell align="right">98.5%</WidgetTableCell>
                </tr>
                <tr>
                  <WidgetTableCell>api-03</WidgetTableCell>
                  <WidgetTableCell>EU-Central</WidgetTableCell>
                  <WidgetTableCell>
                    <WidgetStatusChip label="Down" status="error" />
                  </WidgetTableCell>
                  <WidgetTableCell align="right">0%</WidgetTableCell>
                  <WidgetTableCell align="right">0%</WidgetTableCell>
                  <WidgetTableCell align="right">0%</WidgetTableCell>
                </tr>
                <tr>
                  <WidgetTableCell>db-01</WidgetTableCell>
                  <WidgetTableCell>US-East</WidgetTableCell>
                  <WidgetTableCell>
                    <WidgetStatusChip label="Running" status="success" />
                  </WidgetTableCell>
                  <WidgetTableCell align="right">34%</WidgetTableCell>
                  <WidgetTableCell align="right">54%</WidgetTableCell>
                  <WidgetTableCell align="right">99.99%</WidgetTableCell>
                </tr>
              </tbody>
            </WidgetTable>
          </Widget>
        </div>
      </div>
    </div>
  ),
}

export const SimpleGrid: Story = {
  render: () => (
    <div className="grid gap-4 p-8 md:grid-cols-2 lg:grid-cols-3">
      <div className="h-[250px]">
        <Widget>
          <WidgetHeader title="Counter" />
          <WidgetCounter count={42} unit="items" />
        </Widget>
      </div>

      <div className="h-[250px]">
        <Widget>
          <WidgetHeader title="Status" />
          <WidgetBody>
            <div className="flex h-full items-center justify-center">
              <WidgetStatusBadge label="Online" status="success" />
            </div>
          </WidgetBody>
        </Widget>
      </div>

      <div className="h-[250px]">
        <Widget>
          <WidgetHeader title="List" />
          <div>
            <WidgetListItem title="Item 1" value="100" />
            <WidgetListItem title="Item 2" value="200" />
            <WidgetListItem title="Item 3" value="300" />
          </div>
        </Widget>
      </div>
    </div>
  ),
}
