import { queryOptions, mutationOptions } from '@tanstack/react-query';
import type {
  OrganizationVoiceConfig,
  AdminOrganizationConfig,
  CreateOrganizationConfigPayload,
  UpdateOrganizationConfigPayload
} from './types';
import {
  getOrganizationVoiceConfig,
  getAdminOrganizationConfigs,
  createOrganizationVoiceConfig,
  updateOrganizationVoiceConfig,
  deleteOrganizationVoiceConfig
} from './service';

export const adminConfigKeys = {
  all: ['admin', 'config'] as const,
  orgConfig: (orgId: string) => [...adminConfigKeys.all, 'org', orgId] as const,
  adminList: () => [...adminConfigKeys.all, 'admin-list'] as const
};

export function organizationConfigQueryOptions(organizationId: string) {
  return queryOptions({
    queryKey: adminConfigKeys.orgConfig(organizationId),
    queryFn: () => getOrganizationVoiceConfig(organizationId),
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
}

export function adminOrganizationConfigsQueryOptions() {
  return queryOptions({
    queryKey: adminConfigKeys.adminList(),
    queryFn: () => getAdminOrganizationConfigs(),
    staleTime: 1000 * 60 * 2 // 2 minutes
  });
}

export function createOrganizationConfigMutationOptions() {
  return mutationOptions({
    mutationFn: (data: CreateOrganizationConfigPayload) => createOrganizationVoiceConfig(data),
    onSuccess: (_, variables) => {
      // Invalidate the specific org config
    }
  });
}

export function updateOrganizationConfigMutationOptions() {
  return mutationOptions({
    mutationFn: ({ orgId, data }: { orgId: string; data: UpdateOrganizationConfigPayload }) =>
      updateOrganizationVoiceConfig(orgId, data)
  });
}

export function deleteOrganizationConfigMutationOptions() {
  return mutationOptions({
    mutationFn: (organizationId: string) => deleteOrganizationVoiceConfig(organizationId)
  });
}
