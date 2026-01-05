"use client"

import { useState } from "react"

export function useConfirmation() {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    id: string | null
    title?: string
    description?: string
  }>({
    isOpen: false,
    id: null,
  })

  const confirm = (id: string, title?: string, description?: string) => {
    setConfirmState({ isOpen: true, id, title, description })
  }

  const cancel = () => {
    setConfirmState({ isOpen: false, id: null })
  }

  const execute = (callback: (id: string) => void) => {
    if (confirmState.id) {
      callback(confirmState.id)
    }
    cancel()
  }

  return {
    isOpen: confirmState.isOpen,
    id: confirmState.id,
    title: confirmState.title,
    description: confirmState.description,
    confirm,
    cancel,
    execute,
  }
}
