import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FaqItem } from '@/types/faq';

interface FaqDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  faq: FaqItem | null;
  isDeleting: boolean;
}

export const FaqDeleteDialog: React.FC<FaqDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  faq,
  isDeleting,
}) => {
  if (!faq) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle className="text-base font-bold text-slate-900">
            Delete FAQ Template
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Are you sure you want to delete this FAQ? It will be permanently removed from the Supabase database and vector index.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700">
          <p className="font-semibold text-slate-900">{faq.question}</p>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete FAQ</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
