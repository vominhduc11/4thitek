import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BlogDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  hardDelete?: boolean;
  title?: string;
  count?: number;
}

export function BlogDeleteDialog({ isOpen, onClose, onConfirm, hardDelete = false, title, count = 1 }: BlogDeleteDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{hardDelete ? "Xóa blog vĩnh viễn" : "Xóa blog"}</AlertDialogTitle>
          <AlertDialogDescription>
            {hardDelete
              ? `${count > 1 ? `${count} bài viết` : `Bài viết${title ? ` "${title}"` : ""}`} sẽ bị xóa vĩnh viễn và không thể khôi phục. Bạn chắc chắn chứ?`
              : `${count > 1 ? `${count} bài viết` : `Bài viết${title ? ` "${title}"` : ""}`} sẽ chuyển vào thùng rác. Bạn chắc chắn chứ?`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={hardDelete ? "bg-destructive hover:bg-destructive/90" : ""}>
            {hardDelete ? "Xóa vĩnh viễn" : "Xóa"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
