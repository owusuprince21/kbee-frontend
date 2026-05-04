import { Truck, Shield, Headset } from 'lucide-react';

export default function ServicesBar() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="p-6 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <Truck className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Delivery Nationwide</h3>
            <p className="text-gray-600">Fast and reliable delivery across Ghana</p>
          </div>
          <div className="p-6 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <Shield className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="mb-2 text-xl font-bold">100% Secured Payment</h3>
            <p className="text-gray-600">Your transactions are safe with us</p>
          </div>
          <div className="p-6 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <Headset className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="mb-2 text-xl font-bold">24/7 Dedicated Support</h3>
            <p className="text-gray-600">We&apos;re here to help anytime you need</p>
          </div>
        </div>
      </div>
    </section>
  );
}
