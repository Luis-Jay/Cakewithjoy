import React from "react";
import { ShoppingCart, User, Cake, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface HeaderProps {
  cartCount?: number;
  isAdmin?: boolean;
  onLogout?: () => void;
  onCartClick?: () => void;
}

export function Header({ cartCount = 0, isAdmin = false, onLogout, onCartClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Cake className="w-8 h-8 text-primary" />
            <span className="text-primary">Cake with Joy</span>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-4">
            {!isAdmin && (
              <>
                <Button variant="ghost" size="icon" className="relative" onClick={onCartClick}>
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-secondary text-secondary-foreground">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
              </>
            )}
            {onLogout && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLogout}
                className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}