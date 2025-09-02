// src/utils/products.js

export async function getProductById(type, productId) {
  const products = await import('../data/products.json', {
    with: { type: 'json' }
  }).then(module => module.default);

  if (!products[type]) {
    console.warn(`Type '${type}' not found in products.`);
    return null;
  }

  const product = products[type][productId];

  if (!product) {
    console.warn(`Product with ID '${productId}' not found in '${type}'.`);
    return null;
  }

  return product;
}