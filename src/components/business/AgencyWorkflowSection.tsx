import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, FileText, CheckCircle, MapPin, Package } from 'lucide-react';

interface PopularPackage {
  id: string;
  name: string;
  description: string | null;
  starting_price: number | null;
  image: string | null;
}

interface AgencyWorkflowSectionProps {
  packages: PopularPackage[];
  onContactAgency: () => void;
  onSelectPackage: (pkg: PopularPackage) => void;
}

const workflowSteps = [
  {
    icon: MessageCircle,
    title: 'Inquiry',
    description: 'Contact the agency via call, WhatsApp, or our platform.',
  },
  {
    icon: FileText,
    title: 'Planning',
    description: 'Discuss dates, budget, preferences, and requirements.',
  },
  {
    icon: CheckCircle,
    title: 'Confirmation',
    description: 'Finalize package, price, and detailed itinerary.',
  },
  {
    icon: MapPin,
    title: 'Service',
    description: 'Agency delivers the tour/service as planned.',
  },
];

export function AgencyWorkflowSection({ 
  packages, 
  onContactAgency, 
  onSelectPackage 
}: AgencyWorkflowSectionProps) {
  return (
    <div className="space-y-6">
      {/* How It Works */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">How This Agency Works</h3>
        <p className="text-sm text-muted-foreground">
          We help you plan and experience the best of Ukhrul. Here's how we work together:
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {workflowSteps.map((step, index) => (
            <div 
              key={step.title} 
              className="text-center p-4 bg-muted/50 rounded-lg space-y-2"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                <step.icon className="w-5 h-5" />
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                Step {index + 1}
              </div>
              <h4 className="font-semibold text-sm text-foreground">{step.title}</h4>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Packages */}
      {packages && packages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5" />
            Popular Packages
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="overflow-hidden border-border">
                {pkg.image && (
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img
                      src={pkg.image}
                      alt={pkg.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4 space-y-2">
                  <h4 className="font-semibold text-foreground">{pkg.name}</h4>
                  {pkg.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {pkg.description}
                    </p>
                  )}
                  {pkg.starting_price && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Starting from </span>
                      <span className="font-semibold text-primary">
                        ₹{pkg.starting_price.toLocaleString()}
                      </span>
                    </p>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => onSelectPackage(pkg)}
                  >
                    View Package
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Contact CTA */}
      <Button onClick={onContactAgency} className="w-full">
        <MessageCircle className="w-4 h-4 mr-2" />
        Contact / Book with Agency
      </Button>
    </div>
  );
}
