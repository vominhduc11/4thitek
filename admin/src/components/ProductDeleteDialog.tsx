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

interface ProductDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  hardDelete?: boolean;
  count?: number;
  name?: string;
}

export function ProductDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  hardDelete = false,
  count = 1,
  name,
}: ProductDeleteDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hardDelete ? "Xóa vĩnh viễn" : "Xóa sản phẩm"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hardDelete ? (
              <>
                Hành động này sẽ xóa vĩnh viễn {count > 1 ? `${count} sản phẩm` : `sản phẩm${name ? ` "${name}"` : ""}`} và không thể
                khôi phục. Bạn có chắc chắn?
              </>
            ) : (
              <>
                {count > 1
                  ? `Chuyển ${count} sản phẩm vào thùng rác. Bạn có chắc chắn?`
                  : `Chuyển sản phẩm${name ? ` "${name}"` : ""} vào thùng rác. Bạn có chắc chắn?`}
              </>
            )}
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
