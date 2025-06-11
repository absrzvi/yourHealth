import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, FileText, Trash2, Clock, Calendar } from 'lucide-react';
import { useClaimDraft } from '@/hooks/useClaimDraft';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

interface DraftManagerProps {
  onDraftSelect: (draft: any) => void;
  onNewDraft: () => void;
  currentDraftId?: string;
}

export function DraftManager({ onDraftSelect, onNewDraft, currentDraftId }: DraftManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { listDrafts, deleteDraft, isLoading, error } = useClaimDraft({
    onError: (err) => {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    },
  });
  
  const [drafts, setDrafts] = useState<any[]>([]);

  const loadDrafts = async () => {
    try {
      const data = await listDrafts();
      setDrafts(data || []);
    } catch (err) {
      console.error('Failed to load drafts:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDrafts();
    }
  }, [isOpen]);

  const handleDeleteDraft = async (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      try {
        await deleteDraft(draftId);
        setDrafts(drafts.filter(draft => draft.id !== draftId));
      } catch (err) {
        console.error('Failed to delete draft:', err);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          {currentDraftId ? 'Switch Draft' : 'Load Draft'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Your Drafts</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Select a draft to continue working on it
            </p>
            <Button onClick={onNewDraft} variant="outline" size="sm">
              New Draft
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center text-destructive p-4 bg-destructive/10 rounded-md">
              {error.message}
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed rounded-lg">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <h3 className="font-medium">No drafts found</h3>
              <p className="text-sm text-muted-foreground">
                Start a new claim and save it as a draft to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  onClick={() => {
                    onDraftSelect(draft);
                    setIsOpen(false);
                  }}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${
                    currentDraftId === draft.id ? 'border-primary bg-accent/30' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">
                        {draft.draftName || 'Untitled Draft'}
                      </h4>
                      <div className="text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {draft.patientDOB 
                              ? format(new Date(draft.patientDOB), 'MMM d, yyyy')
                              : 'No DOB'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {format(new Date(draft.updatedAt), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        onClick={(e) => handleDeleteDraft(draft.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete draft</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
