import { Button } from "@zephyr/ui/shadui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@zephyr/ui/shadui/dialog";
import "cropperjs/dist/cropper.css";
import { useRef } from "react";
import { Cropper, type ReactCropperElement } from "react-cropper";

type CropImageDialogProps = {
	src: string;
	cropAspectRatio: number;
	onCropped: (blob: Blob | null) => void;
	onClose: () => void;
};

export default function CropImageDialog({
	src,
	cropAspectRatio,
	onCropped,
	onClose,
}: CropImageDialogProps) {
	const cropperRef = useRef<ReactCropperElement>(null);

	function crop() {
		const cropper = cropperRef.current?.cropper;
		if (!cropper) {
			return;
		}
		cropper.getCroppedCanvas().toBlob((blob) => onCropped(blob), "image/webp");
		onClose();
	}

	return (
		<Dialog onOpenChange={onClose} open>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Crop image</DialogTitle>
				</DialogHeader>
				<Cropper
					aspectRatio={cropAspectRatio}
					className="mx-auto size-fit"
					guides={false}
					ref={cropperRef}
					src={src}
					zoomable={false}
				/>
				<DialogFooter>
					<Button onClick={onClose} variant="secondary">
						Cancel
					</Button>
					<Button onClick={crop}>Crop</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
