import { Router } from 'express'
import db from '../database.js'

const router = Router()
const categories = new Set(['Rice Meals', 'Silog', 'Snacks', 'Drinks', 'Desserts'])
const allItems = db.prepare('SELECT * FROM menu_items ORDER BY id')
const oneItem = db.prepare('SELECT * FROM menu_items WHERE id = ?')

function validate(body) {
  body = body && typeof body === 'object' ? body : {}
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const category = typeof body.category === 'string' ? body.category.trim() : ''
  const price = Number(body.price)
  const stock = Number(body.stock)
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const image = typeof body.image === 'string' ? body.image.trim() : ''
  if (!name) return { error: 'Food name is required.' }
  if (!categories.has(category)) return { error: 'Choose a valid food category.' }
  if (!Number.isFinite(price) || price < 0) return { error: 'Price must be a valid non-negative number.' }
  if (!Number.isInteger(stock) || stock < 0) return { error: 'Stock must be a whole number of zero or more.' }
  if (!description) return { error: 'A food description is required.' }
  try {
    const imageUrl = new URL(image)
    if (!['http:', 'https:'].includes(imageUrl.protocol)) throw new Error()
  } catch {
    return { error: 'Enter a valid HTTP or HTTPS image URL.' }
  }
  return { values: { name, category, price, stock, description, image } }
}

router.get('/menu', (_req, res) => res.json(allItems.all()))
router.get('/menu/:id', (req, res) => {
  const item = oneItem.get(Number(req.params.id))
  if (!item) return res.status(404).json({ error: 'Menu item not found.' })
  res.json(item)
})
router.post('/menu', (req, res) => {
  const result = validate(req.body)
  if (result.error) return res.status(400).json({ error: result.error })
  const { name, category, price, stock, description, image } = result.values
  const created = db.prepare('INSERT INTO menu_items (name, category, price, stock, description, image) VALUES (?, ?, ?, ?, ?, ?)')
    .run(name, category, price, stock, description, image)
  res.status(201).json(oneItem.get(created.lastInsertRowid))
})
router.put('/menu/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!oneItem.get(id)) return res.status(404).json({ error: 'Menu item not found.' })
  const result = validate(req.body)
  if (result.error) return res.status(400).json({ error: result.error })
  const { name, category, price, stock, description, image } = result.values
  db.prepare('UPDATE menu_items SET name = ?, category = ?, price = ?, stock = ?, description = ?, image = ? WHERE id = ?')
    .run(name, category, price, stock, description, image, id)
  res.json(oneItem.get(id))
})
router.delete('/menu/:id', (req, res) => {
  const result = db.prepare('DELETE FROM menu_items WHERE id = ?').run(Number(req.params.id))
  if (!result.changes) return res.status(404).json({ error: 'Menu item not found.' })
  res.status(204).end()
})

const adjustStock = db.prepare('UPDATE menu_items SET stock = stock + ? WHERE id = ? AND stock + ? >= 0')
router.patch('/menu/:id/stock', (req, res) => {
  const id = Number(req.params.id)
  const amount = Number(req.body?.adjustment)
  if (!Number.isInteger(amount) || amount === 0) return res.status(400).json({ error: 'Stock adjustment must be a non-zero whole number.' })
  const result = adjustStock.run(amount, id, amount)
  if (!result.changes) return res.status(oneItem.get(id) ? 400 : 404).json({ error: oneItem.get(id) ? 'Stock cannot be negative.' : 'Menu item not found.' })
  res.json(oneItem.get(id))
})

const consumeItem = db.prepare('UPDATE menu_items SET stock = stock - ? WHERE id = ? AND stock >= ?')
router.post('/stock/consume', (req, res) => {
  if (!Array.isArray(req.body?.lines) || !req.body.lines.length) return res.status(400).json({ error: 'Order must include at least one item.' })
  try {
    db.transaction((lines) => {
      for (const line of lines) {
        const id = Number(line.id)
        const qty = Number(line.qty)
        if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1) throw new Error('Order quantities must be positive whole numbers.')
        if (!consumeItem.run(qty, id, qty).changes) {
          if (!oneItem.get(id)) throw new Error('A menu item in this order no longer exists.')
          throw new Error(`Not enough stock for ${oneItem.get(id).name}.`)
        }
      }
    })(req.body.lines)
    res.json(allItems.all())
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

const restoreItem = db.prepare('UPDATE menu_items SET stock = stock + ? WHERE id = ?')
router.post('/stock/restore', (req, res) => {
  if (!Array.isArray(req.body?.lines)) return res.status(400).json({ error: 'Stock restoration lines are required.' })
  try {
    db.transaction((lines) => {
      for (const line of lines) {
        const id = Number(line.id)
        const qty = Number(line.qty)
        if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1) throw new Error('Stock quantities must be positive whole numbers.')
        restoreItem.run(qty, id)
      }
    })(req.body.lines)
    res.json(allItems.all())
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router