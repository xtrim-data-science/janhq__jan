import { useAtomValue } from 'jotai'

import { twMerge } from 'tailwind-merge'

import DownloadingState from './DownloadingState'

import ImportingModelState from './ImportingModelState'
import InstallingExtension from './InstallingExtension'
import SystemMonitor from './SystemMonitor'
import UpdateApp from './UpdateApp'
import UpdatedFailedModal from './UpdateFailedModal'

import { appDownloadProgressAtom } from '@/helpers/atoms/App.atom'
import { reduceTransparentAtom } from '@/helpers/atoms/Setting.atom'

const BottomPanel = () => {
  const progress = useAtomValue(appDownloadProgressAtom)
  const reduceTransparent = useAtomValue(reduceTransparentAtom)

  return (
    <div
      className={twMerge(
        'fixed bottom-0 left-0 z-50 flex h-9 w-full items-center justify-between px-3 text-xs',
        reduceTransparent &&
          'border-t border-[hsla(var(--app-border))] bg-[hsla(var(--bottom-panel-bg))]'
      )}
    >
      <div className="flex flex-shrink-0 items-center gap-x-2">
        <div className="flex items-center space-x-2">
          {progress && progress > 0 ? (
            <UpdateApp total={100} used={progress} />
          ) : null}
        </div>
        <ImportingModelState />
        <DownloadingState />
        <UpdatedFailedModal />
        <InstallingExtension />
      </div>
      <div className="flex items-center gap-x-1">
        <SystemMonitor />
        <span className="font-medium text-[hsla(var(--text-secondary))]">
          Jan v{VERSION ?? ''}
        </span>
      </div>
    </div>
  )
}

export default BottomPanel