import { useEffect, useState } from 'react'

export const useSimulatedPageLoad = (key: string | number, delay = 350) => {
  const [isLoading, setIsLoading] = useState(false)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    setIsLoading(false)
    return undefined
  }, [key, delay, nonce])

  const reload = () => setNonce((value) => value + 1)

  return { isLoading, reload }
}
