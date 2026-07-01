'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Menu, ChevronDown, ShoppingCart, Heart, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { listCategories } from '@/lib/api/categories';
import { useCartQuery, useWishlistQuery } from '@/lib/api/commerce';
import { useAuthStore } from '@/store/authStore';

const MenuSidebar = dynamic(() => import('@/components/MenuSideBar'), { ssr: false });
const SearchDialog = dynamic(() => import('@/components/SearchDialog'), { ssr: false });

type UiCategory = { name: string; slug: string };

function validSlug(slug: unknown) {
  const value = String(slug || '').trim().toLowerCase();
  return Boolean(value && value !== 'undefined' && value !== 'null');
}

export default function Navbar() {
  const router = useRouter();
  const { user } = useAuthStore();
  const cartQuery = useCartQuery();
  const wishlistQuery = useWishlistQuery();

  // drawers/dialogs
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // search
  const [searchQuery, setSearchQuery] = useState('');

  // categories
  const [cats, setCats] = useState<UiCategory[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setCatsLoading(true);
        const data = await listCategories();
        if (cancelled) return;
        setCats(
          (data || [])
            .filter((c: any) => validSlug(c.slug))
            .map((c: any) => ({ name: String(c.name), slug: String(c.slug).trim() }))
        );
      } catch {
        if (!cancelled) setCats([]);
      } finally {
        if (!cancelled) setCatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // submit search -> /search?q=
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const cartCount =
    cartQuery.data?.items?.reduce((sum: number, item: { quantity?: number | string }) => {
      return sum + Number(item.quantity || 0);
    }, 0) || 0;
  const wishlistCount = wishlistQuery.data?.length || 0;

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white shadow-md">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex h-14 items-center justify-between gap-2 md:h-16 lg:h-20">
            {/* Logo + Brand */}
            <div className="shrink-0">
              <Link href="/" className="flex min-w-max items-center gap-1.5 sm:gap-2 md:gap-3">
                <span className="relative h-7 w-7 overflow-hidden rounded-full ring-1 ring-slate-500/30 md:h-9 md:w-9 lg:h-10 lg:w-10">
                  <Image
                    src="/logo.jpeg"
                    alt="Kbee Computers logo"
                    fill
                    sizes="(max-width:768px) 28px, (max-width:1024px) 36px, 40px"
                    className="object-contain"
                    priority
                  />
                </span>
                <span className="block whitespace-nowrap text-[13px] font-bold leading-none text-slate-950 sm:text-sm md:text-base lg:text-xl">
                  Kbee Computers
                </span>
              </Link>
            </div>

            {/* Center: Categories + Desktop Search */}
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 md:gap-4">
              {/* Categories (desktop only) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="hidden shrink-0 items-center gap-2 md:flex">
                    All Categories
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {catsLoading ? (
                    <>
                      <DropdownMenuItem disabled>Loading…</DropdownMenuItem>
                      <DropdownMenuItem disabled>Loading…</DropdownMenuItem>
                    </>
                  ) : cats.length > 0 ? (
                    cats.map((category) => (
                      <DropdownMenuItem key={category.slug} asChild>
                        <a href={`/category/${category.slug}`}>{category.name}</a>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>No categories</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Desktop search */}
              <form onSubmit={handleSearch} className="hidden min-w-0 flex-1 items-center lg:flex">
                <div className="relative w-full">
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchOpen(true)}
                    className="w-full pl-4 pr-10"
                    aria-label="Search products"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                    aria-label="Submit search"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </div>

            {/* Right actions */}
            <div className="shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                <Link href="/wishlist" className="relative rounded-full p-1.5 transition-colors hover:bg-gray-100 md:p-2" aria-label="Wishlist">
                  <Heart className="h-5 w-5 md:h-6 md:w-6" />
                  {wishlistCount > 0 ? (
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {wishlistCount}
                    </span>
                  ) : null}
                </Link>

                <Link href="/cart" className="relative rounded-full p-1.5 transition-colors hover:bg-gray-100 md:p-2" aria-label="Cart">
                  <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
                  {cartCount > 0 ? (
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-amber-600 px-1 text-[10px] font-bold text-white">
                      {cartCount}
                    </span>
                  ) : null}
                </Link>

                <Link
                  href={user ? '/profile' : '/signin'}
                  className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-full transition-colors hover:bg-gray-100 md:h-10 md:w-10"
                  aria-label={user ? 'Profile' : 'Sign in'}
                >
                  {user?.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || user.email || 'Profile'}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 md:h-6 md:w-6" />
                  )}
                </Link>

                {/* Menu drawer trigger */}
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="rounded-full p-1.5 transition-colors hover:bg-gray-100 md:p-2"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5 md:h-6 md:w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile search */}
          <div className="pb-3 lg:hidden">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full pl-4 pr-10 h-10"
                aria-label="Search products"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                aria-label="Submit search"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Drawer / Dialog */}
      <MenuSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}
