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
    return <LoadingCard message={t('routeGuards.loadingProfile')} />;
  }

  return <>{children}</>;
}

export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  const { profile } = useAppContext();
  const { t } = useTranslation();

  if (!profile) {
    return <LoadingCard message={t('routeGuards.resolvingRole')} />;
  }

  if (profile.role !== role) {
    return (
      <ScreenFrame>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>
              {role === 'TASKER'
                ? t('routeGuards.taskerRequired')
                : t('routeGuards.customerRequired')}
            </CardTitle>
            <CardDescription>
              {t('routeGuards.blockedDesc', {
                role: profile.role,
              })}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <NavLink to="/profile">{t('routeGuards.goToProfile')}</NavLink>
            </Button>
          </CardFooter>
        </Card>
      </ScreenFrame>
    );
  }

  return <>{children}</>;
}
