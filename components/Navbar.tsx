'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Menu, ChevronDown, MessageCircle } from 'lucide-react';
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

const MenuSidebar = dynamic(() => import('@/components/MenuSideBar'), { ssr: false });
const SearchDialog = dynamic(() => import('@/components/SearchDialog'), { ssr: false });

type UiCategory = { name: string; slug: string };

const WHATSAPP_NUMBER =
  (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/[^\d]/g, ''); // digits only

function waLink(message: string) {
  const text = encodeURIComponent(message);
  if (!WHATSAPP_NUMBER) return '#';
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export default function Navbar() {
  const router = useRouter();

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
        setCats((data || []).map((c: any) => ({ name: String(c.name), slug: String(c.slug) })));
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

  const chatHref = waLink('Hello, I want to ask about your products.');

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white shadow-md">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex h-14 items-center justify-between gap-2 md:h-16 lg:h-20">
            {/* Logo + Brand */}
            <div className="min-w-0 shrink-0">
              <Link href="/" className="flex items-center gap-2 md:gap-3">
                <span className="relative h-7 w-7 overflow-hidden rounded-full ring-1 ring-yellow-500/30 md:h-9 md:w-9 lg:h-10 lg:w-10">
                  <Image
                    src="/logo.png"
                    alt="Kbee Computers logo"
                    fill
                    sizes="(max-width:768px) 28px, (max-width:1024px) 36px, 40px"
                    className="object-contain"
                    priority
                  />
                </span>
                <span className="block max-w-[120px] truncate text-sm font-bold leading-none sm:max-w-[180px] md:text-base lg:text-xl">
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
                        <Link href={`/category/${category.slug}`}>{category.name}</Link>
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
                {/* Chat with us (WhatsApp) */}
                <a
                  href={chatHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex"
                  aria-label="Chat with us on WhatsApp"
                >
                  <Button className="h-8 px-3 text-xs md:h-9 md:px-4 md:text-sm bg-green-600 text-white hover:bg-green-700">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chat with Us
                  </Button>
                </a>

                {/* Chat icon (mobile) */}
                <a
                  href={chatHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sm:hidden rounded-full p-1.5 transition-colors hover:bg-gray-100 md:p-2"
                  aria-label="Chat with us on WhatsApp"
                >
                  <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
                </a>

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
