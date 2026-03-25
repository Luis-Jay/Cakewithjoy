import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ShoppingCart, Upload } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

type DiscountType = "none" | "senior" | "pwd";

interface ReadyMadeCake {
  id: string;
  name: string;
  description: string;
  image: string;
  flavor: string;
  size: string;
  price: number;
  available: boolean;
}

const READY_MADE_CAKES: ReadyMadeCake[] = [
  {
    id: "birthday-1",
    name: "Birthday Celebration Cake",
    description: "Colorful frosted cake perfect for birthday parties",
    image: "https://images.unsplash.com/photo-1582232655383-0826ba4f1347?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXJ0aGRheSUyMGNha2UlMjBjb2xvcmZ1bCUyMGZyb3N0aW5nfGVufDF8fHx8MTc3MDU2NzAwM3ww&ixlib=rb-4.1.0&q=80&w=1080",
    flavor: "Vanilla",
    size: '8"x4"',
    price: 1800,
    available: true,
  },
  {
    id: "chocolate-1",
    name: "Chocolate Dream",
    description: "Rich chocolate cake with chocolate ganache",
    image: "https://images.unsplash.com/photo-1645805740318-31bb7604ffd9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBjYWtlJTIwZWxlZ2FudCUyMHNsaWNlZHxlbnwxfHx8fDE3NzA1NjcwMDR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    flavor: "Chocolate",
    size: '8"x4"',
    price: 2000,
    available: true,
  },
  {
    id: "strawberry-1",
    name: "Strawberry Delight",
    description: "Fresh strawberries with light cream frosting",
    image: "https://images.unsplash.com/photo-1573730886197-8636f98b2de0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJhd2JlcnJ5JTIwY2FrZSUyMGRlY29yYXRlZCUyMGZyZXNofGVufDF8fHx8MTc3MDU2NzAwNHww&ixlib=rb-4.1.0&q=80&w=1080",
    flavor: "Strawberry",
    size: '6"x4"',
    price: 1500,
    available: true,
  },
  {
    id: "vanilla-1",
    name: "Classic Vanilla",
    description: "Traditional layered vanilla cake",
    image: "https://images.unsplash.com/photo-1719257795483-fd36e004549e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2YW5pbGxhJTIwY2FrZSUyMGxheWVyZWQlMjBjbGFzc2ljfGVufDF8fHx8MTc3MDU2NzAwNXww&ixlib=rb-4.1.0&q=80&w=1080",
    flavor: "Vanilla",
    size: '8"x6"',
    price: 2200,
    available: true,
  },
  {
    id: "redvelvet-1",
    name: "Red Velvet Romance",
    description: "Classic red velvet with cream cheese frosting",
    image: "https://images.unsplash.com/photo-1700224643955-634f6f11418a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWQlMjB2ZWx2ZXQlMjBjYWtlJTIwY3JlYW0lMjBjaGVlc2V8ZW58MXx8fHwxNzcwNTY3MDA1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    flavor: "Red Velvet",
    size: '8"x4"',
    price: 1900,
    available: true,
  },
  {
    id: "ube-1",
    name: "Ube Delight",
    description: "Filipino favorite purple yam cake",
    image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJhd2JlcnJ5JTIwY2FrZXxlbnwxfHx8fDE3NjI4MzAyNTN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    flavor: "Ube",
    size: '6"x4"',
    price: 1700,
    available: true,
  },
];

export function ReadyMadeCakes() {
  const [selectedCake, setSelectedCake] = useState<ReadyMadeCake | null>(null);
  const [discountType, setDiscountType] = useState<DiscountType>("none");
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [idHoldingPhotoFile, setIdHoldingPhotoFile] = useState<File | null>(null);
  const [showQRPayment, setShowQRPayment] = useState(false);
  const [paymentType, setPaymentType] = useState<"deposit" | "full">("deposit"); // New state for payment type

  const calculatePrice = () => {
    if (!selectedCake) return 0;
    const discountAmount = discountType !== "none" ? selectedCake.price * 0.20 : 0;
    return selectedCake.price - discountAmount;
  };

  const finalPrice = calculatePrice();
  const discountAmount = selectedCake && discountType !== "none" ? selectedCake.price * 0.20 : 0;

  return (
    <div className="container mx-auto px-4 py-8 pb-32">
      <div className="mb-6">
        <h1 className="mb-2">Menu</h1>
        <p className="text-muted-foreground">
          Browse our selection of pre-designed cakes ready for quick order
        </p>
      </div>

      {/* Cake Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {READY_MADE_CAKES.map((cake) => (
          <Card
            key={cake.id}
            className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
              selectedCake?.id === cake.id ? "border-2 border-primary" : ""
            }`}
            onClick={() => setSelectedCake(cake)}
          >
            <div className="aspect-square relative overflow-hidden bg-muted">
              <ImageWithFallback
                src={cake.image}
                alt={cake.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              {selectedCake?.id === cake.id && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                  Selected
                </div>
              )}
              {cake.available && (
                <Badge className="absolute top-2 left-2 bg-green-600">Available</Badge>
              )}
            </div>
            <CardContent className="p-4 space-y-2">
              <h4 className="font-semibold">{cake.name}</h4>
              <p className="text-sm text-muted-foreground">{cake.description}</p>
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm space-y-1">
                  <p className="text-muted-foreground">Flavor: {cake.flavor}</p>
                  <p className="text-muted-foreground">Size: {cake.size}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg text-primary font-semibold">
                    ₱{cake.price.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order Summary */}
      {selectedCake && (
        <Card className="sticky bottom-4 shadow-lg border-2 border-primary/20 max-w-2xl mx-auto">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-center">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Selected Cake:</span>
                <span>{selectedCake.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Flavor:</span>
                <span>{selectedCake.flavor}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Size:</span>
                <span>{selectedCake.size}</span>
              </div>
            </div>

            {/* Discount Selector */}
            <div className="pt-3 border-t space-y-2">
              <Label className="text-sm">Discount (if applicable)</Label>
              <Select value={discountType} onValueChange={(value: DiscountType) => setDiscountType(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select discount type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Discount</SelectItem>
                  <SelectItem value="senior">Senior Citizen (20%)</SelectItem>
                  <SelectItem value="pwd">PWD (20%)</SelectItem>
                </SelectContent>
              </Select>
              
              {/* ID Photo Uploads - Shows when discount is selected */}
              {discountType !== "none" && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-muted-foreground">
                    Please upload photos of your ID for verification
                  </p>
                  
                  {/* Picture of ID */}
                  <div className="space-y-1">
                    <Label htmlFor="id-photo" className="text-xs">
                      1. Picture of ID
                    </Label>
                    <div className="relative">
                      <input
                        type="file"
                        id="id-photo"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setIdPhotoFile(file);
                        }}
                      />
                      <label
                        htmlFor="id-photo"
                        className="flex items-center justify-center gap-2 w-full p-2 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <Upload className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {idPhotoFile ? idPhotoFile.name : "Upload ID Photo"}
                        </span>
                      </label>
                      {idPhotoFile && (
                        <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                          ✓ Uploaded successfully
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ID Owner holding ID */}
                  <div className="space-y-1">
                    <Label htmlFor="id-holding-photo" className="text-xs">
                      2. ID Owner Holding ID
                    </Label>
                    <div className="relative">
                      <input
                        type="file"
                        id="id-holding-photo"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setIdHoldingPhotoFile(file);
                        }}
                      />
                      <label
                        htmlFor="id-holding-photo"
                        className="flex items-center justify-center gap-2 w-full p-2 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <Upload className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {idHoldingPhotoFile ? idHoldingPhotoFile.name : "Upload Photo with ID"}
                        </span>
                      </label>
                      {idHoldingPhotoFile && (
                        <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                          ✓ Uploaded successfully
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="pt-3 border-t-2 space-y-2">
              <div className="flex justify-between items-center">
                <span>Subtotal:</span>
                <span className="text-muted-foreground">
                  ₱{selectedCake.price.toLocaleString()}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Discount (20%):</span>
                  <span>
                    -₱{discountAmount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-semibold">Total Amount:</span>
                <span className="text-primary font-semibold text-lg">
                  ₱{finalPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Information */}
            <div className="pt-3 border-t bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg space-y-2">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                Payment Information:
              </p>
              <div className="space-y-2 text-xs text-amber-900 dark:text-amber-100">
                <div className="flex items-start gap-2">
                  <span className="font-medium">•</span>
                  <p>
                    <span className="font-semibold">Deposits:</span> A 50% deposit (₱{(finalPrice * 0.5).toLocaleString()}) is required at the time of ordering.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium">•</span>
                  <p>
                    <span className="font-semibold">Final Balance:</span> We recommend paying the remaining balance (₱{(finalPrice * 0.5).toLocaleString()}) via <span className="font-medium">Cash</span>, <span className="font-medium">BDO to BDO</span>, or <span className="font-medium">GCash to GCash</span> for faster processing and added security.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                className="w-full gap-2 bg-primary hover:bg-primary/90"
                size="lg"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </Button>
              
              <Button
                variant="outline"
                className="w-full gap-2"
                size="lg"
                onClick={() => setShowQRPayment(true)}
              >
                View QR Payment Options
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Payment Dialog */}
      <Dialog open={showQRPayment} onOpenChange={setShowQRPayment}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              {paymentType === "deposit" ? "50% Deposit Payment" : "Full Payment"}
            </DialogTitle>
            <DialogDescription className="text-center space-y-1">
              <span className="block">
                Scan QR code to pay ₱{paymentType === "deposit" ? (finalPrice * 0.5).toLocaleString() : finalPrice.toLocaleString()}
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* Payment Type Selector */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <Label className="text-sm font-semibold mb-3 block">Choose Payment Option:</Label>
              <RadioGroup value={paymentType} onValueChange={(value: "deposit" | "full") => setPaymentType(value)}>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      paymentType === "deposit"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="deposit" id="deposit" className="mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">50% Deposit</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Pay ₱{(finalPrice * 0.5).toLocaleString()} now
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Balance: ₱{(finalPrice * 0.5).toLocaleString()}
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      paymentType === "full"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="full" id="full" className="mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Pay in Full</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Pay ₱{finalPrice.toLocaleString()} now
                      </p>
                      <p className="text-xs text-green-600">
                        No balance remaining
                      </p>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </div>

            {/* GCash Payment */}
            <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
              <div className="text-center mb-3">
                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">GCash Payment</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">Scan with GCash App</p>
              </div>
              
              {/* Mockup QR Code for GCash */}
              <div className="bg-white p-4 rounded-lg mx-auto w-fit">
                <div className="w-48 h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center border-4 border-blue-400">
                  <div className="text-center">
                    <div className="grid grid-cols-8 gap-1 mb-2">
                      {Array.from({ length: 64 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 ${
                            Math.random() > 0.5 ? 'bg-blue-900' : 'bg-white'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-semibold text-blue-900">GCASH QR</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-xs text-blue-900 dark:text-blue-100">
                <p><span className="font-semibold">Account Name:</span> Cake with Joy</p>
                <p><span className="font-semibold">Account Number:</span> 09XX XXX XXXX</p>
                <p><span className="font-semibold">Amount:</span> ₱{(paymentType === "deposit" ? (finalPrice * 0.5).toLocaleString() : finalPrice.toLocaleString())}</p>
              </div>
            </div>

            {/* BDO Payment */}
            <div className="border-2 border-orange-200 dark:border-orange-800 rounded-lg p-4 bg-orange-50 dark:bg-orange-950/20">
              <div className="text-center mb-3">
                <p className="font-semibold text-orange-900 dark:text-orange-100 mb-1">BDO Bank Transfer</p>
                <p className="text-xs text-orange-700 dark:text-orange-300">Scan with BDO App or use account details</p>
              </div>
              
              {/* Mockup QR Code for BDO */}
              <div className="bg-white p-4 rounded-lg mx-auto w-fit">
                <div className="w-48 h-48 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center border-4 border-orange-400">
                  <div className="text-center">
                    <div className="grid grid-cols-8 gap-1 mb-2">
                      {Array.from({ length: 64 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 ${
                            Math.random() > 0.5 ? 'bg-orange-900' : 'bg-white'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-semibold text-orange-900">BDO QR</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-xs text-orange-900 dark:text-orange-100">
                <p><span className="font-semibold">Account Name:</span> Cake with Joy</p>
                <p><span className="font-semibold">Account Number:</span> 0123 4567 8901</p>
                <p><span className="font-semibold">Amount:</span> ₱{(paymentType === "deposit" ? (finalPrice * 0.5).toLocaleString() : finalPrice.toLocaleString())}</p>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-2">
              <p className="font-semibold">Payment Instructions:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Scan the QR code using your preferred payment app</li>
                <li>Enter the exact deposit amount: ₱{(paymentType === "deposit" ? (finalPrice * 0.5).toLocaleString() : finalPrice.toLocaleString())}</li>
                <li>Take a screenshot of the payment confirmation</li>
                <li>Send the screenshot to verify your order</li>
              </ol>
              <p className="text-primary pt-2">
                ✓ Your order will be confirmed once payment is verified
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}