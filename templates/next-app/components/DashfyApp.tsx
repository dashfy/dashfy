'use client'

import '@getdashfy/ui/styles.css'

import {
  Branches,
  CommitActivityLine,
  ContributorsStats,
  Gitmap,
  OrgBadge,
  PullRequests,
  RepoBadge,
  Status,
  UserBadge,
} from '@getdashfy/ext-github'
import { PriceLive, TableLive } from '@getdashfy/ext-market-live'
import { GameCard, Scoreboard, Standings } from '@getdashfy/ext-nba'
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
import { Dashfy, ThemeRegistry, WidgetRegistry } from '@getdashfy/ui'

ThemeRegistry.loadAllThemes()

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
  UserBadge,
})

// Register NBA extension
WidgetRegistry.addExtension('nba', {
  GameCard,
  Scoreboard,
  Standings,
})

// Register System extension widgets
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

export default function DashfyApp() {
  return <Dashfy />
}
