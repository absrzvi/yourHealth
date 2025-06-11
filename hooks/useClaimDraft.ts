import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from '@/components/ui/use-toast';

interface UseClaimDraftProps {
  onDraftSaved?: (draftId: string) => void;
  onError?: (error: Error) => void;
}

export function useClaimDraft({ onDraftSaved, onError }: UseClaimDraftProps = {}) {
  const { data: session } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Save or update a draft
  const saveDraft = useCallback(async (draftData: any) => {
    if (!session) {
      const err = new Error('Not authenticated');
      onError?.(err);
      throw err;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/claims/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save draft');
      }

      const data = await response.json();
      onDraftSaved?.(data.id);
      
      toast({
        title: 'Draft saved',
        description: 'Your claim has been saved as a draft.',
      });

      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save draft');
      setError(error);
      onError?.(error);
      
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [session, onDraftSaved, onError]);

  // Load a specific draft
  const loadDraft = useCallback(async (draftId: string) => {
    if (!session) {
      const err = new Error('Not authenticated');
      onError?.(err);
      throw err;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/claims/draft?id=${draftId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load draft');
      }

      return await response.json();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load draft');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [session, onError]);

  // List all drafts for the current user
  const listDrafts = useCallback(async () => {
    if (!session) {
      const err = new Error('Not authenticated');
      onError?.(err);
      throw err;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/claims/draft');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load drafts');
      }

      return await response.json();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load drafts');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [session, onError]);

  // Delete a draft
  const deleteDraft = useCallback(async (draftId: string) => {
    if (!session) {
      const err = new Error('Not authenticated');
      onError?.(err);
      throw err;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/claims/draft/${draftId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete draft');
      }

      toast({
        title: 'Draft deleted',
        description: 'The draft has been successfully deleted.',
      });

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete draft');
      setError(error);
      onError?.(error);
      
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [session, onError]);

  return {
    saveDraft,
    loadDraft,
    listDrafts,
    deleteDraft,
    isSaving,
    isLoading,
    error,
  };
}
