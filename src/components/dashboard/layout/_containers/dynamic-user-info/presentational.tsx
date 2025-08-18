'use client';

import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { signOutAction } from '@/lib/actions/auth';
import { AUTH_MESSAGES } from '@/lib/domain/auth';
import { convertActionErrorToMessage } from '@/lib/utils/error-converter';

interface DynamicUserInfoPresentationalProps {
  name: string;
  image: string | null;
}

export function DynamicUserInfoPresentational({
  name,
  image,
}: DynamicUserInfoPresentationalProps) {
  const { execute: executeSignOut, status } = useAction(signOutAction, {
    onError: ({ error }) => {
      const message = convertActionErrorToMessage(
        error,
        AUTH_MESSAGES.SIGNOUT_ERROR,
      );
      toast.error(message);
    },
  });

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">{name}</span>
        <Avatar className="h-8 w-8">
          <AvatarImage src={image || undefined} alt={name} />
          <AvatarFallback>{name.substring(0, 1)}</AvatarFallback>
        </Avatar>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => executeSignOut()}
        disabled={status === 'executing'}
      >
        {status === 'executing' ? 'ログアウト中...' : 'ログアウト'}
      </Button>
    </div>
  );
}
