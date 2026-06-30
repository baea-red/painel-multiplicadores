import { Hono } from 'hono'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { randomBytes } from 'crypto'
import { requireAuth } from '../middleware/auth.js'
import { badRequest } from '../lib/errors.js'

const upload = new Hono()
upload.use('*', requireAuth)

const UPLOADS_DIR = join(process.cwd(), 'uploads')
const MAX_SIZE_MB = 10
const ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.pdf', '.csv'])

upload.post('/', async (c) => {
  const body = await c.req.parseBody()
  const file = body['file']

  if (!(file instanceof File)) return badRequest(c, 'Arquivo não fornecido')
  if (file.size > MAX_SIZE_MB * 1024 * 1024) return badRequest(c, `Arquivo maior que ${MAX_SIZE_MB}MB`)

  const ext = extname(file.name).toLowerCase()
  if (!ALLOWED_EXTS.has(ext)) return badRequest(c, 'Tipo de arquivo não permitido')

  const filename = `${randomBytes(16).toString('hex')}${ext}`

  await mkdir(UPLOADS_DIR, { recursive: true })
  await writeFile(join(UPLOADS_DIR, filename), Buffer.from(await file.arrayBuffer()))

  return c.json({ url: `/api/uploads/${filename}`, nome: file.name, tamanho: file.size }, 201)
})

export default upload
