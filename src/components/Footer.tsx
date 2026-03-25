export function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h4 className="mb-4">About Us</h4>
            <p className="text-muted-foreground">
              Cake with Joy - Creating memorable moments with custom cakes since 2020.
            </p>
          </div>
          <div>
            <h4 className="mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#faqs" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQs
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4">Contact</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>Email: hello@cakewithjoy.com</li>
              <li>Phone: (555) 123-4567</li>
              <li>Address: 123 Bakery Lane</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4">Hours</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>Mon-Fri: 8am - 8pm</li>
              <li>Sat-Sun: 9am - 6pm</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground">
          <p>&copy; 2025 Cake with Joy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
