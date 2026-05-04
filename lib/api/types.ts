import type { Product as FrontProduct, ProductImage, Category, User } from '@/lib/types';

export type Product = FrontProduct;
export type Review = {
  id: number;
  product: number;
  user: { id: string; displayName: string; photoURL: string };
  rating: number;        // 1..5
  comment: string;
  created_at: string;
};

export type HeroItem = {
  id: number;
  product: Product;      // populated product
  order: number;
  is_active: boolean;
};


export type CountdownDeal = {
  id: number;
  kicker?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  cta_text?: string | null;
  cta_label?: string | null;
  cta_href?: string | null;
  image_url?: string | null;
  starts_at: string;
  ends_at: string;
  active?: boolean;        // from serializer
  is_running?: boolean;    // from serializer
  product?: {
    slug?: string | null;
    name?: string | null;
    main_image_url?: string | null;
    images?: { image?: string | null }[];
  } | null;
};


export type WishlistItem = {
  id: number;
  product: Product;
  added_at: string;
};

export type CartItem = {
  id: number;
  product: Product;
  quantity: number;
};
