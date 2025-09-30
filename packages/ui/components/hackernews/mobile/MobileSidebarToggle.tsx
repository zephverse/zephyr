import { Menu } from "lucide-react";
import type React from "react";
import { Button } from "../../../shadui/button";
import { Sheet, SheetContent, SheetTrigger } from "../../../shadui/sheet";

type MobileSidebarToggleProps = {
  children: React.ReactNode;
};

export function MobileSidebarToggle({ children }: MobileSidebarToggleProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className="fixed top-16 left-4 z-50 h-12 w-12 rounded-full border-orange-500/20 bg-orange-500/10 backdrop-blur-xs hover:bg-orange-500/20 md:hidden"
          size="icon"
          variant="outline"
        >
          <Menu className="h-6 w-6 text-orange-500" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-80 p-0" side="left">
        {children}
      </SheetContent>
    </Sheet>
  );
}
