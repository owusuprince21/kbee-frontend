'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HotDealBanners() {
  return (
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* LEFT CARD — External Drives */}
        <div className="rounded-2xl bg-[#DBF0EF] p-3 sm:p-4 md:p-6">
          {/* Lock the card height */}
          <div className="grid h-[220px] sm:h-[240px] md:h-[260px] items-center gap-3 md:grid-cols-2 md:gap-4">
            {/* Product image */}
            <div className="relative order-1 h-full">
              <Image
                src="/external-drive.png"
                alt="External Drives"
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Copy */}
            <div className="order-2 text-center md:text-left leading-tight">
              <p className="text-slate-700/80 text-sm sm:text-base">External Drives</p>
              <h3 className="mt-0.5 line-clamp-2 text-2xl font-extrabold text-[#162a45] sm:text-3xl md:text-4xl">
                Boost Your Storage
              </h3>
              <p className="mt-1 text-base font-semibold text-teal-600 sm:text-lg">
                Flat 20% off
              </p>

              <Link href="/category/external-drives" className="inline-block">
                <Button className="mt-3 h-9 px-4 text-sm rounded-full bg-teal-600 text-white hover:bg-teal-700">
                  Shop Now
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT CARD — Laptop Chargers */}
        <div className="rounded-2xl bg-[#FDE9DF] p-3 sm:p-4 md:p-6">
          {/* Lock the card height */}
          <div className="grid h-[220px] sm:h-[240px] md:h-[260px] items-center gap-3 md:grid-cols-2 md:gap-4">
            {/* Copy */}
            <div className="order-2 md:order-1 text-center md:text-left leading-tight">
              <p className="text-slate-700/80 text-sm sm:text-base">Laptop Chargers</p>
              <h3 className="mt-0.5 line-clamp-2 text-2xl font-extrabold text-[#162a45] sm:text-3xl md:text-4xl">
                Up to 40% off
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-700 sm:text-[15px]">
                OEM and high-quality replacements for every major brand.
              </p>

              <Link href="/category/laptop-chargers" className="inline-block">
                <Button className="mt-3 h-9 px-4 text-sm rounded-full bg-orange-500 text-white hover:bg-orange-600">
                  Buy Now
                </Button>
              </Link>
            </div>

            {/* Product image */}
            <div className="relative order-1 md:order-2 h-full">
              <Image
                src="/chargers.png"
                alt="Laptop Charger"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
