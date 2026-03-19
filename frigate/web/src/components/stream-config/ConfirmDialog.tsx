import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { isMobile } from "react-device-detect";
import { useTranslation } from "react-i18next";

type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
};

export function ConfirmDialog({ isOpen, onClose, onSave }: ConfirmDialogProps) {
  const { t } = useTranslation(["components/dialog"]);

  const handleSave = () => {
    onSave();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onOpenAutoFocus={(e) => {
          if (isMobile) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Confirmation</DialogTitle>
        </DialogHeader>
        <p>Are you sure you want to broadcast these streams?</p>
        <DialogFooter>
          <Button
            aria-label={t("button.cancel", { ns: "common" })}
            onClick={onClose}
          >
            {t("button.cancel", { ns: "common" })}
          </Button>
          <Button
            onClick={handleSave}
            variant="select"
            className="mb-2 md:mb-0"
            aria-label={t("button.confirm")}
          >
            {t("button.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
