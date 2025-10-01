import type { PostData, TagWithCount, UserData } from "@zephyr/db";
import { Button } from "@zephyr/ui/shadui/button";
import { Dialog, DialogContent, DialogTitle } from "@zephyr/ui/shadui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@zephyr/ui/shadui/dropdown-menu";
import { AtSign, MoreHorizontal, Tags, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { MentionTags } from "@/components/Tags/MentionTags";
import { Tags as TagsComponent } from "@/components/Tags/Tags";
import DeletePostDialog from "./DeletePostDialog";

type PostMoreButtonProps = {
	post: PostData;
	className?: string;
	onUpdate?: (updatedPost: PostData) => void;
};

export default function PostMoreButton({
	post,
	className,
	onUpdate,
}: PostMoreButtonProps) {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showMentionsDialog, setShowMentionsDialog] = useState(false);
	const [showTagsDialog, setShowTagsDialog] = useState(false);

	const mentions = useMemo(
		() => post.mentions?.map((m) => m.user) || [],
		[post.mentions],
	);

	const handleMentionsUpdate = useCallback(
		(newMentions: UserData[]) => {
			if (JSON.stringify(mentions) !== JSON.stringify(newMentions)) {
				const updatedPost: PostData = {
					...post,
					mentions: newMentions.map((user) => ({
						id: `${post.id}-${user.id}`,
						postId: post.id,
						userId: user.id,
						user,
						createdAt: new Date(),
					})),
				};
				onUpdate?.(updatedPost);
				setShowMentionsDialog(false);
			}
		},
		[post, onUpdate, mentions],
	);

	const handleTagsUpdate = useCallback(
		(newTags: TagWithCount[]) => {
			if (JSON.stringify(post.tags) !== JSON.stringify(newTags)) {
				const updatedPost: PostData = {
					...post,
					tags: newTags,
				};
				onUpdate?.(updatedPost);
				setShowTagsDialog(false);
			}
		},
		[post, onUpdate],
	);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button className={className} size="icon" variant="ghost">
						<MoreHorizontal className="size-5 text-muted-foreground" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={() => setShowMentionsDialog(true)}>
						<span className="flex items-center gap-3 text-foreground">
							<AtSign className="size-4" />
							Edit Mentions
						</span>
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => setShowTagsDialog(true)}>
						<span className="flex items-center gap-3 text-foreground">
							<Tags className="size-4" />
							Edit Tags
						</span>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
						<span className="flex items-center gap-3 text-destructive">
							<Trash2 className="size-4" />
							Delete
						</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog onOpenChange={setShowMentionsDialog} open={showMentionsDialog}>
				<DialogContent>
					<DialogTitle>Edit Mentions</DialogTitle>
					<MentionTags
						// @ts-expect-error
						isOwner={true}
						mentions={mentions}
						onMentionsChange={handleMentionsUpdate}
						postId={post.id}
					/>
				</DialogContent>
			</Dialog>

			<Dialog onOpenChange={setShowTagsDialog} open={showTagsDialog}>
				<DialogContent>
					<DialogTitle>Edit Tags</DialogTitle>
					<TagsComponent
						isOwner={true}
						onTagsChange={handleTagsUpdate}
						postId={post.id}
						tags={post.tags}
					/>
				</DialogContent>
			</Dialog>

			<DeletePostDialog
				onClose={() => setShowDeleteDialog(false)}
				open={showDeleteDialog}
				post={post}
			/>
		</>
	);
}
