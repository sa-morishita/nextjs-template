import { getSession } from '@/lib/services/auth';
import { DynamicUserInfoPresentational } from './presentational';

export async function DynamicUserInfoContainer() {
  const session = await getSession();
  const user = session.user;

  return (
    <DynamicUserInfoPresentational
      name={user.name}
      image={user.image || null}
    />
  );
}
