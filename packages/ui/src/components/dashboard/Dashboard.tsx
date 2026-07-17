import type { Dashboard as DashboardType } from '@dashfy/types'
import * as React from 'react'

export interface DashboardProps {
  children: React.ReactNode
  dashboard: DashboardType
}

export const Dashboard = ({ children, dashboard }: DashboardProps) => {
  return (
    <>
      <style>{`
        @media (min-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: repeat(${dashboard.columns}, minmax(0, 1fr)) !important;
            grid-template-rows: repeat(${dashboard.rows}, minmax(200px, 1fr)) !important;
            grid-auto-rows: unset !important;
          }
        }
      `}</style>
      <div
        className="dashboard-grid relative grid h-full w-full gap-2 p-2"
        style={{
          // Mobile & Tablet: auto-fit
          // Desktop: use configured columns from media query
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gridAutoRows: 'minmax(300px, auto)',
        }}
      >
        {children}
      </div>
    </>
  )
}
