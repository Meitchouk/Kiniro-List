"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  Flex,
  Stack,
  Skeleton,
} from "@/components/ds";
import {
  Settings,
  Database,
  Mail,
  Shield,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Server,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

interface SystemStatus {
  firebase: boolean;
  redis: boolean;
  email: boolean;
  anilist: boolean;
}

interface SystemInfo {
  version: string;
  environment: string;
  nodeVersion: string;
  uptime: number;
}

export default function AdminSettingsPage() {
  const t = useTranslations();
  const { user, getAuthHeaders } = useAuth();

  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const checkSystemStatus = useCallback(async () => {
    if (!user) return;

    setCheckingStatus(true);
    try {
      const headers = await getAuthHeaders();

      // Check health endpoint
      const healthResponse = await fetch("/api/health", { headers });
      const healthData = await healthResponse.json();

      setSystemStatus({
        firebase: healthData.services?.firebase || false,
        redis: healthData.services?.redis || false,
        email: healthData.services?.email || false,
        anilist: healthData.services?.anilist || false,
      });

      setSystemInfo({
        version: healthData.version || "1.0.0",
        environment: healthData.environment || "production",
        nodeVersion: healthData.nodeVersion || "unknown",
        uptime: healthData.uptime || 0,
      });
    } catch (error) {
      console.error("Error checking system status:", error);
      toast.error(t("adminPanel.settings.statusError"));
    } finally {
      setCheckingStatus(false);
      setLoading(false);
    }
  }, [user, getAuthHeaders, t]);

  useEffect(() => {
    if (user) {
      checkSystemStatus();
    }
  }, [user, checkSystemStatus]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(" ") || "< 1m";
  };

  const StatusIndicator = ({ status, label }: { status: boolean; label: string }) => (
    <Flex align="center" gap={3}>
      {status ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <AlertCircle className="h-5 w-5 text-red-500" />
      )}
      <Typography variant="body2">{label}</Typography>
    </Flex>
  );

  if (loading) {
    return (
      <div className="p-6">
        <Stack gap={6}>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </Stack>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Stack gap={6}>
        {/* Header */}
        <Flex justify="between" align="center" wrap="wrap" gap={4}>
          <Stack gap={1}>
            <Typography variant="h2">{t("adminPanel.settings.title")}</Typography>
            <Typography variant="body2" colorScheme="secondary">
              {t("adminPanel.settings.description")}
            </Typography>
          </Stack>
          <Button variant="outline" onClick={checkSystemStatus} disabled={checkingStatus}>
            <RefreshCw className={`mr-2 h-4 w-4 ${checkingStatus ? "animate-spin" : ""}`} />
            {t("adminPanel.settings.checkStatus")}
          </Button>
        </Flex>

        {/* System Info */}
        <Card>
          <CardHeader>
            <Flex align="center" gap={2}>
              <Server className="h-5 w-5" />
              <Typography variant="h4">{t("adminPanel.settings.systemInfo")}</Typography>
            </Flex>
          </CardHeader>
          <CardContent>
            {systemInfo && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Stack gap={1}>
                  <Typography variant="caption" colorScheme="secondary">
                    {t("adminPanel.settings.version")}
                  </Typography>
                  <Typography variant="body2" weight="medium">
                    {systemInfo.version}
                  </Typography>
                </Stack>
                <Stack gap={1}>
                  <Typography variant="caption" colorScheme="secondary">
                    {t("adminPanel.settings.environment")}
                  </Typography>
                  <Typography variant="body2" weight="medium">
                    {systemInfo.environment}
                  </Typography>
                </Stack>
                <Stack gap={1}>
                  <Typography variant="caption" colorScheme="secondary">
                    {t("adminPanel.settings.nodeVersion")}
                  </Typography>
                  <Typography variant="body2" weight="medium">
                    {systemInfo.nodeVersion}
                  </Typography>
                </Stack>
                <Stack gap={1}>
                  <Typography variant="caption" colorScheme="secondary">
                    {t("adminPanel.settings.uptime")}
                  </Typography>
                  <Typography variant="body2" weight="medium">
                    {formatUptime(systemInfo.uptime)}
                  </Typography>
                </Stack>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Status */}
        <Card>
          <CardHeader>
            <Flex align="center" gap={2}>
              <Globe className="h-5 w-5" />
              <Typography variant="h4">{t("adminPanel.settings.serviceStatus")}</Typography>
            </Flex>
          </CardHeader>
          <CardContent>
            {systemStatus && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatusIndicator
                  status={systemStatus.firebase}
                  label={t("adminPanel.settings.firebase")}
                />
                <StatusIndicator
                  status={systemStatus.redis}
                  label={t("adminPanel.settings.redis")}
                />
                <StatusIndicator
                  status={systemStatus.email}
                  label={t("adminPanel.settings.emailService")}
                />
                <StatusIndicator
                  status={systemStatus.anilist}
                  label={t("adminPanel.settings.anilist")}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <Flex align="center" gap={2}>
              <Settings className="h-5 w-5" />
              <Typography variant="h4">{t("adminPanel.settings.quickActions")}</Typography>
            </Flex>
          </CardHeader>
          <CardContent>
            <Stack gap={4}>
              <Flex justify="between" align="center" wrap="wrap" gap={4}>
                <Stack gap={1}>
                  <Typography variant="body2" weight="medium">
                    {t("adminPanel.settings.clearCache")}
                  </Typography>
                  <Typography variant="caption" colorScheme="secondary">
                    {t("adminPanel.settings.clearCacheDescription")}
                  </Typography>
                </Stack>
                <Button
                  variant="outline"
                  onClick={() => toast.info(t("adminPanel.settings.featureComingSoon"))}
                >
                  <Database className="mr-2 h-4 w-4" />
                  {t("adminPanel.settings.clearCache")}
                </Button>
              </Flex>

              <hr className="border-muted" />

              <Flex justify="between" align="center" wrap="wrap" gap={4}>
                <Stack gap={1}>
                  <Typography variant="body2" weight="medium">
                    {t("adminPanel.settings.testEmail")}
                  </Typography>
                  <Typography variant="caption" colorScheme="secondary">
                    {t("adminPanel.settings.testEmailDescription")}
                  </Typography>
                </Stack>
                <Button
                  variant="outline"
                  onClick={() => toast.info(t("adminPanel.settings.featureComingSoon"))}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {t("adminPanel.settings.sendTestEmail")}
                </Button>
              </Flex>

              <hr className="border-muted" />

              <Flex justify="between" align="center" wrap="wrap" gap={4}>
                <Stack gap={1}>
                  <Typography variant="body2" weight="medium">
                    {t("adminPanel.settings.maintenanceMode")}
                  </Typography>
                  <Typography variant="caption" colorScheme="secondary">
                    {t("adminPanel.settings.maintenanceModeDescription")}
                  </Typography>
                </Stack>
                <Button
                  variant="outline"
                  onClick={() => toast.info(t("adminPanel.settings.featureComingSoon"))}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {t("adminPanel.settings.toggle")}
                </Button>
              </Flex>
            </Stack>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-500/50">
          <CardHeader>
            <Flex align="center" gap={2}>
              <AlertCircle className="h-5 w-5 text-red-500" />
              <Typography variant="h4" className="text-red-500">
                {t("adminPanel.settings.dangerZone")}
              </Typography>
            </Flex>
          </CardHeader>
          <CardContent>
            <Stack gap={4}>
              <Flex justify="between" align="center" wrap="wrap" gap={4}>
                <Stack gap={1}>
                  <Typography variant="body2" weight="medium">
                    {t("adminPanel.settings.resetDatabase")}
                  </Typography>
                  <Typography variant="caption" colorScheme="secondary">
                    {t("adminPanel.settings.resetDatabaseDescription")}
                  </Typography>
                </Stack>
                <Button
                  variant="destructive"
                  onClick={() => toast.error(t("adminPanel.settings.actionDisabled"))}
                  disabled
                >
                  {t("adminPanel.settings.resetDatabase")}
                </Button>
              </Flex>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </div>
  );
}
