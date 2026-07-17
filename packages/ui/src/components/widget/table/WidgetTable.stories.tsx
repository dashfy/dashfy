import type { Meta, StoryObj } from '@storybook/react-vite'

import { Widget } from '../base/Widget'
import { WidgetHeader } from '../base/WidgetHeader'
import { WidgetStatusChip } from '../status/WidgetStatusChip'
import { WidgetTable } from './WidgetTable'
import { WidgetTableCell } from './WidgetTableCell'
import { WidgetTableHeadCell } from './WidgetTableHeadCell'

const meta = {
  title: 'Widgets/Table/WidgetTable',
  component: WidgetTable,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WidgetTable>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="w-[600px]">
      <Widget>
        <WidgetHeader title="Simple Table" />
        <WidgetTable>
          <thead>
            <tr>
              <WidgetTableHeadCell>Name</WidgetTableHeadCell>
              <WidgetTableHeadCell>Status</WidgetTableHeadCell>
              <WidgetTableHeadCell align="right">Value</WidgetTableHeadCell>
            </tr>
          </thead>
          <tbody>
            <tr>
              <WidgetTableCell>Item 1</WidgetTableCell>
              <WidgetTableCell>Active</WidgetTableCell>
              <WidgetTableCell align="right">100</WidgetTableCell>
            </tr>
            <tr>
              <WidgetTableCell>Item 2</WidgetTableCell>
              <WidgetTableCell>Pending</WidgetTableCell>
              <WidgetTableCell align="right">250</WidgetTableCell>
            </tr>
            <tr>
              <WidgetTableCell>Item 3</WidgetTableCell>
              <WidgetTableCell>Completed</WidgetTableCell>
              <WidgetTableCell align="right">175</WidgetTableCell>
            </tr>
          </tbody>
        </WidgetTable>
      </Widget>
    </div>
  ),
}

export const WithStatusChips: Story = {
  render: () => (
    <div className="w-[700px]">
      <Widget>
        <WidgetHeader title="Server Status" />
        <WidgetTable>
          <thead>
            <tr>
              <WidgetTableHeadCell>Server</WidgetTableHeadCell>
              <WidgetTableHeadCell>Region</WidgetTableHeadCell>
              <WidgetTableHeadCell>Status</WidgetTableHeadCell>
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
              <WidgetTableCell align="right">99.9%</WidgetTableCell>
            </tr>
            <tr>
              <WidgetTableCell>api-02</WidgetTableCell>
              <WidgetTableCell>US-West</WidgetTableCell>
              <WidgetTableCell>
                <WidgetStatusChip label="Warning" status="warning" />
              </WidgetTableCell>
              <WidgetTableCell align="right">98.5%</WidgetTableCell>
            </tr>
            <tr>
              <WidgetTableCell>api-03</WidgetTableCell>
              <WidgetTableCell>EU-Central</WidgetTableCell>
              <WidgetTableCell>
                <WidgetStatusChip label="Down" status="error" />
              </WidgetTableCell>
              <WidgetTableCell align="right">0%</WidgetTableCell>
            </tr>
          </tbody>
        </WidgetTable>
      </Widget>
    </div>
  ),
}

export const UserTable: Story = {
  render: () => (
    <div className="w-[800px]">
      <Widget>
        <WidgetHeader title="Recent Users" />
        <WidgetTable>
          <thead>
            <tr>
              <WidgetTableHeadCell>Name</WidgetTableHeadCell>
              <WidgetTableHeadCell>Email</WidgetTableHeadCell>
              <WidgetTableHeadCell>Role</WidgetTableHeadCell>
              <WidgetTableHeadCell>Status</WidgetTableHeadCell>
            </tr>
          </thead>
          <tbody>
            <tr>
              <WidgetTableCell>John Doe</WidgetTableCell>
              <WidgetTableCell>john@example.com</WidgetTableCell>
              <WidgetTableCell>Admin</WidgetTableCell>
              <WidgetTableCell>
                <WidgetStatusChip label="Active" status="success" />
              </WidgetTableCell>
            </tr>
            <tr>
              <WidgetTableCell>Jane Smith</WidgetTableCell>
              <WidgetTableCell>jane@example.com</WidgetTableCell>
              <WidgetTableCell>Editor</WidgetTableCell>
              <WidgetTableCell>
                <WidgetStatusChip label="Active" status="success" />
              </WidgetTableCell>
            </tr>
            <tr>
              <WidgetTableCell>Bob Johnson</WidgetTableCell>
              <WidgetTableCell>bob@example.com</WidgetTableCell>
              <WidgetTableCell>Viewer</WidgetTableCell>
              <WidgetTableCell>
                <WidgetStatusChip label="Inactive" status="unknown" />
              </WidgetTableCell>
            </tr>
          </tbody>
        </WidgetTable>
      </Widget>
    </div>
  ),
}

export const MetricsTable: Story = {
  render: () => (
    <div className="w-[600px]">
      <Widget>
        <WidgetHeader title="Performance Metrics" />
        <WidgetTable>
          <thead>
            <tr>
              <WidgetTableHeadCell>Metric</WidgetTableHeadCell>
              <WidgetTableHeadCell align="right">Current</WidgetTableHeadCell>
              <WidgetTableHeadCell align="right">Average</WidgetTableHeadCell>
              <WidgetTableHeadCell align="right">Peak</WidgetTableHeadCell>
            </tr>
          </thead>
          <tbody>
            <tr>
              <WidgetTableCell>Response Time</WidgetTableCell>
              <WidgetTableCell align="right">125ms</WidgetTableCell>
              <WidgetTableCell align="right">150ms</WidgetTableCell>
              <WidgetTableCell align="right">380ms</WidgetTableCell>
            </tr>
            <tr>
              <WidgetTableCell>Throughput</WidgetTableCell>
              <WidgetTableCell align="right">1,234 req/s</WidgetTableCell>
              <WidgetTableCell align="right">1,100 req/s</WidgetTableCell>
              <WidgetTableCell align="right">1,890 req/s</WidgetTableCell>
            </tr>
            <tr>
              <WidgetTableCell>Error Rate</WidgetTableCell>
              <WidgetTableCell align="right">0.12%</WidgetTableCell>
              <WidgetTableCell align="right">0.15%</WidgetTableCell>
              <WidgetTableCell align="right">0.45%</WidgetTableCell>
            </tr>
          </tbody>
        </WidgetTable>
      </Widget>
    </div>
  ),
}

export const CompactTable: Story = {
  render: () => (
    <div className="w-[400px]">
      <Widget>
        <WidgetHeader title="Quick Stats" />
        <WidgetTable>
          <tbody>
            <tr>
              <WidgetTableCell>Total Users</WidgetTableCell>
              <WidgetTableCell align="right">12,345</WidgetTableCell>
            </tr>
            <tr>
              <WidgetTableCell>Active Sessions</WidgetTableCell>
              <WidgetTableCell align="right">1,234</WidgetTableCell>
            </tr>
            <tr>
              <WidgetTableCell>Avg. Response</WidgetTableCell>
              <WidgetTableCell align="right">125ms</WidgetTableCell>
            </tr>
            <tr>
              <WidgetTableCell>Uptime</WidgetTableCell>
              <WidgetTableCell align="right">99.9%</WidgetTableCell>
            </tr>
          </tbody>
        </WidgetTable>
      </Widget>
    </div>
  ),
}
