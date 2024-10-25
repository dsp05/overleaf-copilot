import { RefObject } from 'preact'
import { useEffect } from 'preact/hooks'

export const useClickOutside = (
    ref: RefObject<HTMLElement | undefined>,
    callback: () => void
) => {
    const handleClick = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as HTMLElement)) {
            callback()
        }
    }

    useEffect(() => {
        document.addEventListener('click', handleClick)

        return () => {
            document.removeEventListener('click', handleClick)
        }
    })
}