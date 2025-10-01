import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@zephyr/ui/shadui/button";
import { MailPlus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ChannelSort } from "stream-chat";
import {
  ChannelList,
  ChannelPreviewMessenger,
  type ChannelPreviewUIComponentProps,
  type DefaultStreamChatGenerics,
  useChatContext,
} from "stream-chat-react";
import { useSession } from "@/app/(main)/session-provider";
import { cn } from "@/lib/utils";
import NewChatDialog from "./new-chat-dialog";

type ChatSidebarProps = {
  open: boolean;
  onClose: () => void;
  // biome-ignore lint/suspicious/noExplicitAny: any
  onChannelSelect?: (channel: any) => void;
};

export default function ChatSidebar({
  open,
  onClose,
  onChannelSelect,
}: ChatSidebarProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { setActiveChannel } = useChatContext();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["unread-messages-count"] });
  }, [queryClient]);

  const ChannelPreviewCustom = useCallback(
    (props: ChannelPreviewUIComponentProps) => (
      <ChannelPreviewMessenger
        {...props}
        onSelect={() => {
          props.setActiveChannel?.(props.channel, props.watchers);
          if (onChannelSelect) {
            onChannelSelect(props.channel);
          }
          onClose();
        }}
      />
    ),
    [onClose, onChannelSelect]
  );

  const filters = {
    type: "messaging",
    members: { $in: [user.id] },
  };

  const options = {
    state: true,
    presence: true,
    limit: 8,
  };

  const sort: ChannelSort<DefaultStreamChatGenerics> = {
    last_message_at: -1 as const,
  };

  return (
    <div
      className={cn(
        "size-full flex-col border-e md:flex md:w-72",
        open ? "flex" : "hidden"
      )}
    >
      <MenuHeader
        onChatCreated={(channel) => {
          setActiveChannel(channel);
          if (onChannelSelect) {
            onChannelSelect(channel);
          }
          onClose();
        }}
        onClose={onClose}
      />
      <ChannelList
        additionalChannelSearchProps={{
          searchForChannels: true,
          searchQueryParams: {
            channelFilters: {
              filters: {
                members: { $in: [user.id] },
              },
            },
          },
        }}
        filters={filters}
        options={options}
        Preview={ChannelPreviewCustom}
        showChannelSearch
        sort={sort}
      />
    </div>
  );
}

type MenuHeaderProps = {
  onClose: () => void;
  // biome-ignore lint/suspicious/noExplicitAny: any
  onChatCreated: (channel: any) => void;
};

function MenuHeader({ onClose, onChatCreated }: MenuHeaderProps) {
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3 p-2">
        <div className="h-full md:hidden">
          <Button onClick={onClose} size="icon" variant="ghost">
            <X className="size-5" />
          </Button>
        </div>
        <h1 className="me-auto font-bold text-xl md:ms-2">Whispers</h1>
        <Button
          onClick={() => setShowNewChatDialog(true)}
          size="icon"
          title="Start new whisper"
          variant="ghost"
        >
          <MailPlus className="size-5" />
        </Button>
      </div>
      {showNewChatDialog && (
        <NewChatDialog
          onChatCreated={(channel) => {
            setShowNewChatDialog(false);
            onChatCreated(channel);
          }}
          onOpenChange={setShowNewChatDialog}
        />
      )}
    </>
  );
}
