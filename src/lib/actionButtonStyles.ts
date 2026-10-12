export type ActionTone = 'insert' | 'update' | 'delete' | 'select' | 'report' | 'view'

const ACTION_TONE_CLASS: Record<ActionTone, string> = {
  insert: 'action-insert',
  update: 'action-update',
  delete: 'action-delete',
  select: 'action-select',
  report: 'action-report',
  view: 'action-view',
}

export function getActionToneClass(tone: ActionTone) {
  return ACTION_TONE_CLASS[tone]
}

export function getSubmitToneClass(label: string) {
  const normalized = label.trim().toLowerCase()

  if (normalized.includes('save changes') || normalized.includes('update') || normalized.includes('edit')) {
    return ACTION_TONE_CLASS.update
  }

  if (normalized.includes('delete') || normalized.includes('remove')) {
    return ACTION_TONE_CLASS.delete
  }

  if (normalized.includes('assign') || normalized.includes('select') || normalized.includes('choose')) {
    return ACTION_TONE_CLASS.select
  }

  if (normalized.includes('load') || normalized.includes('export') || normalized.includes('excel') || normalized.includes('refresh')) {
    return ACTION_TONE_CLASS.report
  }

  if (normalized.includes('view') || normalized.includes('print') || normalized.includes('open') || normalized.includes('preview')) {
    return ACTION_TONE_CLASS.view
  }

  return ACTION_TONE_CLASS.insert
}