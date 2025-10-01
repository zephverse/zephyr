import type { CommentData } from "@zephyr/db";
import { Button } from "@zephyr/ui/shadui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@zephyr/ui/shadui/dialog";
import LoadingButton from "@/components/Auth/LoadingButton";
import { useDeleteCommentMutation } from "./mutations";

type DeleteCommentDialogProps = {
  comment: CommentData;
  open: boolean;
  onClose: () => void;
};

export default function DeleteCommentDialog({
  comment,
  open,
  onClose,
}: DeleteCommentDialogProps) {
  const mutation = useDeleteCommentMutation();

  function handleOpenChange(open: boolean) {
    if (!(open && mutation.isPending)) {
      onClose();
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Eddy?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this Eddy? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <LoadingButton
            loading={mutation.isPending}
            onClick={() => mutation.mutate(comment.id, { onSuccess: onClose })}
            variant="destructive"
          >
            Delete
          </LoadingButton>
          <Button
            disabled={mutation.isPending}
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
