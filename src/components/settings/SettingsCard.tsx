"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Flex,
  Stack,
  IconWrapper,
} from "@/components/ds";

interface SettingsCardProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    children: ReactNode;
}

export function SettingsCard({ title, description, icon: Icon, children }: SettingsCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <Flex align="center" gap={2}>
                        {Icon && <IconWrapper icon={Icon} size="md" colorScheme="primary" />}
                        {title}
                    </Flex>
                </CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <Stack gap={4}>
                    {children}
                </Stack>
            </CardContent>
        </Card>
    );
}
