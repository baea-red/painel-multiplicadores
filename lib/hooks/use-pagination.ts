import { useState } from 'react'

export const PAGE_SIZE_OPTIONS = [10, 15, 20, 25, 30]

export function usePagination<T>(items: T[], defaultPageSize = 10) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const paginated = items.slice(start, start + pageSize)

  function changePageSize(size: number) {
    setPageSize(size)
    setPage(1)
  }

  function changePage(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)))
  }

  return { paginated, page: safePage, pageSize, totalPages, total: items.length, changePage, changePageSize }
}
