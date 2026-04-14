import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, NavLink, useLocation } from 'react-router-dom';

import { Button } from '../components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useAppContext } from '../context/AppContext';
import type { Role } from '../context/AppContext';
import { LoadingCard } from '../layout/LoadingCard';
import { ScreenFrame } from '../layout/ScreenFrame';
import { isRestrictedUser } from '../lib/userAccess';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, profile, profileBusy } = useAppContext();
  const location = useLocation();
  const { t } = useTranslation();

  if (!session) {
    return <Navigate replace state={{ from: location.pathname }} to="/auth" />;
  }

  if (isRestrictedUser(profile)) {
    return <Navigate replace to="/banned" />;
  }

  if (profileBusy && !profile) {
    return (
      <LoadingCard message={t('routeGuards.loadingProfile', 'Loading your account profile...')} />
    );
  }

  return <>{children}</>;
}

export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  const { profile } = useAppContext();
  const { t } = useTranslation();

  if (!profile) {
    return <LoadingCard message={t('routeGuards.resolvingRole', 'Resolving role access...')} />;
  }

  if (profile.role !== role) {
    return (
      <ScreenFrame>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>
              {role === 'TASKER'
                ? t('routeGuards.taskerRequired', 'Tasker role required')
                : t('routeGuards.customerRequired', 'Customer role required')}
            </CardTitle>
            <CardDescription>
              {t('routeGuards.blockedDesc', {
                role: profile.role,
                defaultValue:
                  'Route guard blocked this path because your account role is currently {{role}}.',
              })}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <NavLink to="/profile">{t('routeGuards.goToProfile', 'Go to profile')}</NavLink>
            </Button>
          </CardFooter>
        </Card>
      </ScreenFrame>
    );
  }

  return <>{children}</>;
}
