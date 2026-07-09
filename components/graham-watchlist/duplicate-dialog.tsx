"use client";

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
interface DuplicateDialogProps {
  stockName: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DuplicateDialog({
  stockName,
  onConfirm,
  onCancel,
}: DuplicateDialogProps) {
  return (
    <AlertDialog
      open={stockName !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>이미 워치리스트에 있습니다</AlertDialogTitle>
          <AlertDialogDescription>
            {stockName} 최신 데이터로 새로고침할까요?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>확인</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
