import {
  Branches,
  CommitActivityLine,
  ContributorsStats,
  Gitmap,
  OrgBadge,
  PullRequests,
  RepoBadge,
  Status,
  TrafficClonesHistogram,
  TrafficViewsHistogram,
  UserBadge,
} from '@getdashfy/ext-github'
import { PriceLive, TableLive } from '@getdashfy/ext-market-live'
import {
  CpuUsage,
  CpuUsageGauge,
  CpuUsageLine,
  DiskUsage,
  DiskUsageGauge,
  MemoryUsage,
  MemoryUsageGauge,
  MemoryUsageLine,
  NetworkStats,
  NetworkStatsCompact,
  NetworkStatsLine,
  Processes,
  SystemInfo,
} from '@getdashfy/ext-system'
import { Dashfy, WidgetRegistry } from '@getdashfy/ui'

// Register GitHub extension
WidgetRegistry.addExtension('github', {
  Branches,
  CommitActivityLine,
  ContributorsStats,
  Gitmap,
  OrgBadge,
  PullRequests,
  RepoBadge,
  Status,
  TrafficClonesHistogram,
  TrafficViewsHistogram,
  UserBadge,
})

// Register System extension
WidgetRegistry.addExtension('system', {
  CpuUsage,
  CpuUsageGauge,
  CpuUsageLine,
  DiskUsage,
  DiskUsageGauge,
  MemoryUsage,
  MemoryUsageGauge,
  MemoryUsageLine,
  NetworkStats,
  NetworkStatsCompact,
  NetworkStatsLine,
  Processes,
  SystemInfo,
})

// Register Market Live extension
WidgetRegistry.addExtension('market-live', {
  PriceLive,
  TableLive,
})

export const App = () => {
  return <Dashfy />
}
