import * as React from 'react'

import { RefreshCwIcon, TrashIcon } from '@/components/common/Icons'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export const DataActions = () => {
  const [showClearDataDialog, setShowClearDataDialog] = React.useState(false)

  const handleForceReload = () => {
    window.location.reload()
  }

  const handleClearData = () => {
    if ('caches' in window) {
      caches
        .keys()
        .then((names) => {
          names.forEach((name) => {
            caches.delete(name).catch(console.error)
          })
        })
        .catch(console.error)
    }

    handleForceReload()
  }

  return (
    <>
      <div className="space-y-3">
        <div className="space-y-0.5">
          <span className="text-sm font-medium">Data & Cache</span>
          <p className="text-xs text-muted-foreground">Manage application data and cache</p>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            className="w-full justify-start gap-2"
            variant="outline"
            onClick={handleForceReload}
          >
            <RefreshCwIcon className="h-4 w-4" />
            Force Reload
          </Button>

          <Button
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            variant="outline"
            onClick={() => setShowClearDataDialog(true)}
          >
            <TrashIcon className="h-4 w-4" />
            Clear Data
          </Button>
        </div>
      </div>

      {showClearDataDialog && (
        <AlertDialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Application Data</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all cached data and reload the application. Your settings and
                preferences will be preserved, but any temporary data will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearData}>Clear Data</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
