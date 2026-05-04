import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Newsletter() {
  return (
    <section className="py-16 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="mb-4 text-3xl font-bold">Subscribe to Our Newsletter</h2>
        <p className="mb-8 text-gray-300">Get the latest deals and product updates</p>
        <form className="mx-auto flex max-w-md gap-4">
          <Input type="email" placeholder="Enter your email" className="flex-1 bg-white text-black" />
          <Button className="bg-yellow-500 px-8 text-black hover:bg-yellow-600">Subscribe</Button>
        </form>
      </div>
    </section>
  );
}
