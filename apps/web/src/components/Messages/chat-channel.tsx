import { Button } from "@zephyr/ui/shadui/button";
import { Menu } from "lucide-react";
import {
  ChannelHeader,
  type ChannelHeaderProps,
  MessageInput,
  MessageList,
  Window,
} from "stream-chat-react";
import { cn } from "@/lib/utils";

type ChatChannelProps = {
  open: boolean;
  openSidebar: () => void;
};

export default function ChatChannel({ open, openSidebar }: ChatChannelProps) {
  return (
    <div className={cn("w-full md:block", !open && "hidden")}>
      <Window>
        <CustomChannelHeader openSidebar={openSidebar} />
        <MessageList />
        <MessageInput />
      </Window>
    </div>
  );
}

interface CustomChannelHeaderProps extends ChannelHeaderProps {
  openSidebar: () => void;
}

function CustomChannelHeader({
  openSidebar,
  ...props
}: CustomChannelHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-full p-2 md:hidden">
        <Button onClick={openSidebar} size="icon" variant="ghost">
          <Menu className="size-5" />
        </Button>
      </div>
      <ChannelHeader {...props} />
    </div>
  );
}
