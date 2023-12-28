import React from 'react'
import { ButtonWithTooltip } from '.././primitives/toolbar'
import { openLinkEditDialog$ } from '../../link-dialog'
import { useCellValue, usePublisher } from '@mdxeditor/gurx'
import { iconComponentFor$ } from '@/plugins/core'

/**
 * A toolbar component that opens the link edit dialog.
 * For this component to work, you must include the `linkDialogPlugin`.
 */
export const CreateLink = () => {
  const openLinkDialog = usePublisher(openLinkEditDialog$)
  const iconComponentFor = useCellValue(iconComponentFor$)
  return (
    <ButtonWithTooltip
      title="Create link"
      onClick={(_) => {
        openLinkDialog(true)
      }}
    >
      {iconComponentFor('link')}
    </ButtonWithTooltip>
  )
}
