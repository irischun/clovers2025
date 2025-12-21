import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navigation = () => {
  return (
    <nav className="py-4 px-4 sm:px-6 lg:px-8 bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-xl">🍀</span>
          </div>
          <span className="font-display text-xl font-bold">
            <span className="text-foreground">CLOVER</span>
          </span>
        </div>

        {/* Login Button */}
        <Button variant="outline" className="gap-2 border-border hover:bg-secondary hover:border-primary/50">
          <LogIn className="w-4 h-4" />
          <span>登入</span>
        </Button>
      </div>
    </nav>
  );
};

export default Navigation;
