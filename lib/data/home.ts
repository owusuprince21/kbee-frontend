// lib/data/home.ts
import { Product } from '@/lib/types';

export const heroProducts: Product[] = [
  {
    id: 1,
    name: 'Dell Latitude 7490 - UK Used',
    slug: 'dell-latitude-7490',
    description: 'Intel Core i7, 16GB RAM, 512GB SSD, 14" Full HD Display',
    price: 649.99,
    discount_price: 549.99,
    category: { id: 1, name: 'Laptops', slug: 'laptops', image: '', description: '' },
    stock_quantity: 5,
    is_in_stock: true,
    condition: 'UK Used',
    brand: 'Dell',
    images: [{ id: 1, image: '/dell.png', is_primary: true }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: true,
    is_new_arrival: false,
    is_best_seller: true,
  },
  {
    id: 2,
    name: 'HP EliteBook 840 G6 - UK Used',
    slug: 'hp-elitebook-840-g6',
    description: 'Intel Core i5, 8GB RAM, 256GB SSD, 14" Display',
    price: 499.99,
    discount_price: 429.99,
    category: { id: 1, name: 'Laptops', slug: 'laptops', image: '', description: '' },
    stock_quantity: 8,
    is_in_stock: true,
    condition: 'UK Used',
    brand: 'HP',
    images: [{ id: 2, image: '/hp.png', is_primary: true }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: true,
    is_new_arrival: false,
    is_best_seller: true,
  },
  {
    id: 3,
    name: 'Lenovo ThinkPad T480 - UK Used',
    slug: 'lenovo-thinkpad-t480',
    description: 'Intel Core i5, 16GB RAM, 512GB SSD, 14" Full HD',
    price: 579.99,
    discount_price: 499.99,
    category: { id: 1, name: 'Laptops', slug: 'laptops', image: '', description: '' },
    stock_quantity: 3,
    is_in_stock: true,
    condition: 'UK Used',
    brand: 'Lenovo',
    images: [{ id: 3, image: '/lenovo.png', is_primary: true }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: true,
    is_new_arrival: true,
    is_best_seller: false,
  },
];

export const newArrivals: Product[] = heroProducts;
export const bestSelling: Product[] = heroProducts;

export const categories = [
  { name: 'Laptops', slug: 'laptops', image: '/laptops.jpeg' },
  { name: 'Laptop Chargers', slug: 'laptop-chargers', image: '/charger.jpeg' },
  { name: 'WiFi Routers', slug: 'wifi-routers', image: '/wifi.jpeg' },
  { name: 'External Drives', slug: 'external-drives', image: '/external-drive.jpg' },
];

export const testimonials = [
  {
    name: 'John Smith',
    role: 'Business Owner',
    comment:
      'Excellent quality laptops at unbeatable prices. The Dell Latitude I purchased works perfectly!',
    rating: 5,
  },
  {
    name: 'Sarah Johnson',
    role: 'Student',
    comment:
      'Fast delivery and great customer service. Highly recommend Kbee Computers for anyone looking for affordable laptops.',
    rating: 5,
  },
  {
    name: 'Michael Brown',
    role: 'IT Professional',
    comment:
      'Best place to buy UK used laptops. All products are thoroughly tested and in excellent condition.',
    rating: 5,
  },
];

// Optional: data for the "Hot Deal" section
export const hotDeal = {
  title: 'Hot Deal of the Day',
  productTitle: 'MacBook Pro 13" - UK Used',
  specs: 'Intel Core i5, 8GB RAM, 256GB SSD',
  price: 699.99,
  compareAt: 899.99,
  image: '/apple.png',
  href: '/product/macbook-pro-13',
};
