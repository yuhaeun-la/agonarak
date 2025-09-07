import { useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  // 초기값을 함수로 지연 초기화
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // 상태와 localStorage를 동기화하는 함수
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // 함수인 경우 현재 값을 전달하여 실행
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      // localStorage에 저장 (클라이언트에서만)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue] as const
}
