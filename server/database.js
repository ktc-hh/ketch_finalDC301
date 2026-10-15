import Database from 'better-sqlite3'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const db = new Database(path.join(here, 'kainan.sqlite'))
db.pragma('journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL CHECK (stock >= 0),
    description TEXT NOT NULL,
    image TEXT NOT NULL
  )
`)

const initialMenu = [
  ['Adobo Rice Meal', 'Rice Meals', 195, 20, 'Classic Filipino chicken adobo served with steamed rice.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyHU7pAmV4bjK2J9ABBqFuMPCEugjkS_HnOjrSsM0NKOozdpiuT4qArUY&s=10'],
  ['Chicken Inasal Bowl', 'Rice Meals', 165, 18, 'Grilled chicken inasal with rice and savory house glaze.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfEN0eQrBIo0Jl62Gm3gHMB4qut2No5zmVaXCnUuwREidp-WCUye9Ehdo&s=10'],
  ['Pork Sisig Rice', 'Rice Meals', 285, 10, 'Sizzling-style chopped pork sisig with rice.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpkeWbIFyeU6kYw97wMhta9xqcn_OauIcLJu291zIchA&s=10'],
  ['Sinigang na Baboy', 'Rice Meals', 245, 8, 'Pork simmered in a bright tamarind broth.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8t_A0WoQWr_8qSDgDqkYWc0qV1fcQ09582aDnOqYMp3adr1FOQrNhqA&s=10'],
  ['Halang-halang', 'Snacks', 120, 12, 'A comforting, gently spiced Filipino chicken dish.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIVy29-rCzm6LtW_apIrxX0UB9nmFVJZXFPB213WNfQN0KhtTHEYFi0Wk&s=10'],
  ['Palabok', 'Snacks', 85, 30, 'Rice noodles topped with savory palabok sauce and garnish.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTvTUjvj78QjTEiRpfbE2E-gYbV52qnmSOgbbP41t9nfg&s=10'],
  ['Lumpiang Shanghai', 'Snacks', 110, 25, 'Crispy Filipino spring rolls served golden brown.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUdke1jrFkN0sWJjpt_5STiOiFgH1M_0BOP6Vm5S6__Q&s=10'],
  ['Puto Kutsinta', 'Snacks', 65, 40, 'Soft steamed rice cakes with a delicate chewy bite.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJMBwP5zqPS0ggJk4C-07ucipdqReM5SZiCP30C5AntA&s=10'],
  ['Buko Pandan', 'Drinks', 95, 15, 'Chilled coconut and pandan dessert drink.', 'https://www.recipesbynora.com/wp-content/uploads/2022/03/buko-pandan-featured-image.jpg'],
  ['Leche Flan', 'Desserts', 90, 12, 'Silky Filipino custard topped with caramel.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnQcD6_OVadOyD_kKTPYB8UrSYvSoT5rRimccqffjzKA&s=10'],
  ['Halo-Halo', 'Desserts', 115, 14, 'A colorful Filipino shaved-ice treat with sweet toppings.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWW2GtOoQ_xFOJWKV4magtLu5OypULI93JnTpDRJz9bQ&s=10'],
]

if (db.prepare('SELECT COUNT(*) AS total FROM menu_items').get().total === 0) {
  const insert = db.prepare('INSERT INTO menu_items (name, category, price, stock, description, image) VALUES (?, ?, ?, ?, ?, ?)')
  db.transaction(() => initialMenu.forEach((item) => insert.run(...item)))()
}

export default db