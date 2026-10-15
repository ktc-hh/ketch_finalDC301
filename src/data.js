import { reactive } from 'vue'

export const MENU = reactive([
  { id: 1, name: 'Adobo Rice Meal', cat: 'Rice Meals', price: 195, stock: 20, description: 'Classic Filipino chicken adobo served with steamed rice.', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyHU7pAmV4bjK2J9ABBqFuMPCEugjkS_HnOjrSsM0NKOozdpiuT4qArUY&s=10' },
  { id: 2, name: 'Chicken Inasal Bowl', cat: 'Rice Meals', price: 165, stock: 18, description: 'Grilled chicken inasal with rice and savory house glaze.', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfEN0eQrBIo0Jl62Gm3gHMB4qut2No5zmVaXCnUuwREidp-WCUye9Ehdo&s=10' },
  { id: 3, name: 'Pork Sisig Rice', cat: 'Rice Meals', price: 285, stock: 10, description: 'Sizzling-style chopped pork sisig with rice.', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpkeWbIFyeU6kYw97wMhta9xqcn_OauIcLJu291zIchA&s=10' },
  { id: 4, name: 'Sinigang na Baboy', cat: 'Rice Meals', price: 245, stock: 8, description: 'Pork simmered in a bright tamarind broth.', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8t_A0WoQWr_8qSDgDqkYWc0qV1fcQ09582aDnOqYMp3adr1FOQrNhqA&s=10' },
  { id: 5, name: 'Halang-halang', cat: 'Snacks', price: 120, stock: 12, description: 'A comforting, gently spiced Filipino chicken dish.', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIVy29-rCzm6LtW_apIrxX0UB9nmFVJZXFPB213WNfQN0KhtTHEYFi0Wk&s=10' },
  { id: 6, name: 'Palabok', cat: 'Snacks', price: 85, stock: 30, description: 'Rice noodles topped with savory palabok sauce and garnish.', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTvTUjvj78QjTEiRpfbE2E-gYbV52qnmSOgbbP41t9nfg&s=10' },
  { id: 7, name: 'Lumpiang Shanghai', cat: 'Snacks', price: 110, stock: 25, description: 'Crispy Filipino spring rolls served golden brown.', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUdke1jrFkN0sWJjpt_5STiOiFgH1M_0BOP6Vm5S6__Q&s=10' },
  { id: 8, name: 'Puto Kutsinta', cat: 'Snacks', price: 65, stock: 40, description: 'Soft steamed rice cakes with a delicate chewy bite.', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJMBwP5zqPS0ggJk4C-07ucipdqReM5SZiCP30C5AntA&s=10' },
  { id: 9, name: 'Buko Pandan', cat: 'Drinks', price: 95, stock: 15, description: 'Chilled coconut and pandan dessert drink.', image: 'https://www.recipesbynora.com/wp-content/uploads/2022/03/buko-pandan-featured-image.jpg' },
  { id: 10, name: 'Leche Flan', cat: 'Desserts', price: 90, stock: 12, description: 'Silky Filipino custard topped with caramel.', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnQcD6_OVadOyD_kKTPYB8UrSYvSoT5rRimccqffjzKA&s=10' },
  { id: 11, name: 'Halo-Halo', cat: 'Desserts', price: 115, stock: 14, description: 'A colorful Filipino shaved-ice treat with sweet toppings.', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWW2GtOoQ_xFOJWKV4magtLu5OypULI93JnTpDRJz9bQ&s=10' },
])

export const DISCOUNTS = {
  None: 0,
  'Senior / PWD 20%': 0.2,
  'Promo 10%': 0.1
};

export const TABLE_COUNT = 10;