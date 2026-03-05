import { useEffect, useState } from 'react'

export const useSimulatedPageLoad = (key: string | number, delay = 350) => {
  const [isLoading, setIsLoading] = useState(true)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let disposed = false
    let finishTimer = 0
    const startTimer = window.setTimeout(() => {
      if (disposed) {
        return
      }
      setIsLoading(true)
      finishTimer = window.setTimeout(() => {
        if (!disposed) {
          setIsLoading(false)
        }
      }, delay)
    }, 0)

    return () => {
      disposed = true
      window.clearTimeout(startTimer)
      window.clearTimeout(finishTimer)
    }
  }, [key, delay, nonce])

  const reload = () => setNonce((value) => value + 1)

  return { isLoading, reload }
}
