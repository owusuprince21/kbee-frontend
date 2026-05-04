export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  discount_price?: number;
  category: Category;
  stock_quantity: number;
  is_in_stock: boolean;
  condition: 'New' | 'UK Used';
  brand: string;
  images: ProductImage[];
  created_at: string;
  updated_at: string;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  specifications?:string;
}

export interface ProductImage {
  id: number;
  image: string;
  is_primary: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image: string;
  description: string;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
}

export interface WishlistItem {
  id: number;
  product: Product;
  added_at: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
}
