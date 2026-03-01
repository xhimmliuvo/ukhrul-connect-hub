import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Phone, MessageCircle, Truck, ExternalLink } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  image: string | null;
  category: string | null;
}

interface ProductDetailModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  businessPhone: string | null;
  businessWhatsapp: string | null;
  onOrderViaDropee: (product: Product) => void;
}

export function ProductDetailModal({
  product,
  open,
  onOpenChange,
  businessName,
  businessPhone,
  businessWhatsapp,
  onOrderViaDropee,
}: ProductDetailModalProps) {
  if (!product) return null;

  const handleCall = () => {
    if (businessPhone) {
      window.location.href = `tel:${businessPhone}`;
    }
  };

  const handleWhatsApp = () => {
    if (businessWhatsapp) {
      const phone = businessWhatsapp.replace(/\D/g, '');
      const message = encodeURIComponent(
        `Hi ${businessName}, I'm interested in "${product.name}" (₹${product.discount_price || product.price}). Is it available?`
      );
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    }
  };

  const discount = product.discount_price
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {product.image && (
          <div className="aspect-video w-full overflow-hidden bg-muted">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 space-y-4">
          <DialogHeader className="text-left p-0">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                {product.category && (
                  <Badge variant="secondary" className="text-xs">
                    {product.category}
                  </Badge>
                )}
                <DialogTitle className="text-xl">{product.name}</DialogTitle>
              </div>
              <div className="text-right shrink-0">
                {product.discount_price ? (
                  <>
                    <p className="text-xl font-bold text-primary">₹{product.discount_price}</p>
                    <p className="text-sm text-muted-foreground line-through">₹{product.price}</p>
                    <Badge variant="destructive" className="text-xs mt-1">{discount}% OFF</Badge>
                  </>
                ) : (
                  <p className="text-xl font-bold text-primary">₹{product.price}</p>
                )}
              </div>
            </div>
          </DialogHeader>

          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          )}

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">How would you like to order?</p>

            {/* Direct to Vendor */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Contact vendor directly</p>
              <div className="flex gap-2">
                {businessPhone && (
                  <Button variant="outline" className="flex-1 gap-2" onClick={handleCall}>
                    <Phone className="h-4 w-4" />
                    Call
                  </Button>
                )}
                {businessWhatsapp && (
                  <Button variant="outline" className="flex-1 gap-2" onClick={handleWhatsApp}>
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                )}
              </div>
              {!businessPhone && !businessWhatsapp && (
                <p className="text-xs text-muted-foreground italic">No direct contact available</p>
              )}
            </div>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                or
              </span>
            </div>

            {/* Order via Dropee */}
            <Button
              className="w-full gap-2"
              onClick={() => {
                onOrderViaDropee(product);
                onOpenChange(false);
              }}
            >
              <Truck className="h-4 w-4" />
              Order via #Dropee
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
