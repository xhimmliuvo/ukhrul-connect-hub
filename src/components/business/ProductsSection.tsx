import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  image: string | null;
  category: string | null;
}

interface ProductsSectionProps {
  products: Product[];
  onOrderProduct: (product: Product) => void;
}

export function ProductsSection({ products, onOrderProduct }: ProductsSectionProps) {
  if (!products || products.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No products available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Products & Items</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden border-border">
            {product.image && (
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardContent className="p-3 space-y-2">
              {product.category && (
                <Badge variant="secondary" className="text-xs">
                  {product.category}
                </Badge>
              )}
              <h4 className="font-medium text-sm text-foreground line-clamp-1">
                {product.name}
              </h4>
              {product.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
              )}
              <div className="flex items-center gap-2">
                {product.discount_price ? (
                  <>
                    <span className="font-semibold text-primary">
                      ₹{product.discount_price}
                    </span>
                    <span className="text-xs text-muted-foreground line-through">
                      ₹{product.price}
                    </span>
                  </>
                ) : (
                  <span className="font-semibold text-primary">
                    ₹{product.price}
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={() => onOrderProduct(product)}
              >
                Order / Enquire
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
