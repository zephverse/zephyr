import type { Media } from "@prisma/client";
import { MediaPreviews } from "@/components/Home/feedview/MediaPreviews";
import { AttachmentPreview } from "@/components/Posts/editor/AttachmentPreview";
import type { Attachment } from "../types";

type SupportMediaPreviewProps = {
  attachments: Attachment[];
  onRemove: (index: number) => void;
  uploadedMedia?: Media[];
};

export function SupportMediaPreview({
  attachments,
  onRemove,
  uploadedMedia,
}: SupportMediaPreviewProps) {
  return (
    <div className="space-y-4">
      {attachments.map((attachment, index) => (
        <AttachmentPreview
          attachment={{
            file: attachment.file,
            isUploading: false,
          }}
          key={attachment.key}
          onRemoveClick={() => {
            if (attachment.previewUrl) {
              URL.revokeObjectURL(attachment.previewUrl);
            }
            onRemove(index);
          }}
        />
      ))}
      {uploadedMedia && uploadedMedia.length > 0 && (
        <MediaPreviews attachments={uploadedMedia} />
      )}
    </div>
  );
}
