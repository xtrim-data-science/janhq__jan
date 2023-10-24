'use client'

import React from 'react'
import SecondaryButton from '../SecondaryButton'
import { useSetAtom } from 'jotai'
import {
  MainViewState,
  setMainViewStateAtom,
} from '@helpers/atoms/MainView.atom'
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useGetDownloadedModels } from '@hooks/useGetDownloadedModels'

const LeftHeaderAction: React.FC = () => {
  const setMainView = useSetAtom(setMainViewStateAtom)
  const { downloadedModels } = useGetDownloadedModels()

  const onExploreClick = () => {
    setMainView(MainViewState.ExploreModel)
  }

  const onCreateBotClicked = () => {
    if (downloadedModels.length === 0) {
      alert('You need to download at least one model to create a bot.')
      return
    }
    setMainView(MainViewState.CreateBot)
  }

  return (
    <div className="sticky top-0 mb-4 flex flex-row gap-2">
      <SecondaryButton
        title={'Explore'}
        onClick={onExploreClick}
        className="flex-1"
        icon={<MagnifyingGlassIcon width={16} height={16} />}
      />
      <SecondaryButton
        title={'Create bot'}
        onClick={onCreateBotClicked}
        className="flex-1"
        icon={<PlusIcon width={16} height={16} />}
      />
    </div>
  )
}

export default React.memo(LeftHeaderAction)