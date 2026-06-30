const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export async function uploadArquivo(file: File): Promise<string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('gmb_token') : null

  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error ?? 'Erro ao fazer upload')
  }

  const data = await res.json() as { url: string }
  return data.url
}
