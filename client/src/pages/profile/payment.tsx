import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, Plus, MoreHorizontal, Shield } from "lucide-react";
import { Link } from "wouter";

export default function PaymentMethodsPage() {
  const { user, isAuthenticated } = useAuth();
  const [paymentMethods] = useState([
    {
      id: "1",
      type: "visa",
      lastFour: "4242",
      expiryMonth: "12",
      expiryYear: "25",
      isDefault: true,
    },
    {
      id: "2",
      type: "mastercard", 
      lastFour: "8888",
      expiryMonth: "06",
      expiryYear: "26",
      isDefault: false,
    }
  ]);

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sign in required</h2>
          <p className="text-muted-foreground">Log in to manage your payment methods</p>
        </div>
        <Navigation />
      </div>
    );
  }

  const getCardIcon = (type: string) => {
    const baseClasses = "w-8 h-6 rounded flex items-center justify-center text-xs font-bold text-white";
    switch (type.toLowerCase()) {
      case 'visa':
        return <div className={`${baseClasses} bg-blue-600`}>VISA</div>;
      case 'mastercard':
        return <div className={`${baseClasses} bg-red-500`}>MC</div>;
      case 'amex':
        return <div className={`${baseClasses} bg-green-600`}>AMEX</div>;
      default:
        return <CreditCard className="w-6 h-6 text-muted-foreground" />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
      {/* Header */}
      <header className="px-6 py-6 bg-white border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="mr-3 -ml-2" data-testid="button-back-payment">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center">
              <CreditCard className="w-6 h-6 text-primary mr-3" />
              <h1 className="text-xl font-bold text-foreground">Payment Methods</h1>
            </div>
          </div>
          <Button size="sm" data-testid="button-add-payment">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Manage your cards and payment options</p>
      </header>

      {/* Content */}
      <div className="px-6 py-6 space-y-4">
        {paymentMethods.map((method) => (
          <Card key={method.id} className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getCardIcon(method.type)}
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-semibold text-foreground">•••• {method.lastFour}</p>
                      {method.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Expires {method.expiryMonth}/{method.expiryYear}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" data-testid={`button-payment-menu-${method.id}`}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Payment Method Card */}
        <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/10">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Add Payment Method</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add a card for easy subscription payments
            </p>
            <Button variant="outline" data-testid="button-add-new-payment">
              Add Card
            </Button>
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800 mb-1">Your payments are secure</p>
                <p className="text-xs text-green-700">
                  We use industry-standard encryption to protect your payment information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
}