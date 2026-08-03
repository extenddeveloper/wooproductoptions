namespace WooOptionsFic.Api {
  const apiFetch = wp.apiFetch;
  apiFetch.use(apiFetch.createNonceMiddleware(window.WooOptionsFicAdmin.nonce));

  export async function request<T>(path: string, options: { method?: string; data?: unknown } = {}): Promise<T> {
    return apiFetch({
      path: `/wooptionsfic/v1${path}`,
      method: options.method ?? 'GET',
      data: options.data,
    }) as Promise<T>;
  }

  export function listOptionSets(params: {
    page?: number;
    perPage?: number;
    status?: WooOptionsFic.OptionSetStatus;
    search?: string;
    orderBy?: string;
    order?: 'ASC' | 'DESC';
  } = {}): Promise<WooOptionsFic.OptionSetCollection> {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      perPage: String(params.perPage ?? 10),
      status: params.status ?? 'active',
      search: params.search ?? '',
      orderBy: params.orderBy ?? 'updated_at_gmt',
      order: params.order ?? 'DESC',
    });
    return request<WooOptionsFic.OptionSetCollection>(`/option-sets?${query.toString()}`);
  }

  export function createOptionSet(title: string): Promise<WooOptionsFic.OptionSetRecord> {
    return request('/option-sets', { method: 'POST', data: { title } });
  }

  export function getOptionSet(uuid: string): Promise<WooOptionsFic.OptionSetRecord> {
    return request(`/option-sets/${uuid}`);
  }

  export function updateOptionSet(uuid: string, data: Record<string, unknown>): Promise<WooOptionsFic.OptionSetRecord> {
    return request(`/option-sets/${uuid}`, { method: 'PUT', data });
  }

  export function duplicateOptionSet(uuid: string): Promise<WooOptionsFic.OptionSetRecord> {
    return request(`/option-sets/${uuid}/duplicate`, { method: 'POST' });
  }

  export function deleteOptionSet(uuid: string): Promise<{ deleted: boolean; uuid: string }> {
    return request(`/option-sets/${uuid}/delete-permanently`, { method: 'POST' });
  }

  export function saveRevision(
    uuid: string,
    definition: WooOptionsFic.OptionSetDefinition,
    expectedHash: string,
    versionNote: string,
  ): Promise<WooOptionsFic.OptionSetRecord> {
    return request(`/option-sets/${uuid}/revisions`, {
      method: 'POST',
      data: { definition, expectedHash, versionNote },
    });
  }

  export function validateDefinition(uuid: string, definition: WooOptionsFic.OptionSetDefinition): Promise<{
    valid: boolean;
    errors: WooOptionsFic.ValidationIssue[];
    warnings: WooOptionsFic.ValidationIssue[];
    contentHash: string;
  }> {
    return request(`/option-sets/${uuid}/validate`, { method: 'POST', data: { definition } });
  }

  export function publishOptionSet(uuid: string, expectedHash: string): Promise<WooOptionsFic.OptionSetRecord> {
    return request(`/option-sets/${uuid}/publish`, {
      method: 'POST',
      data: { expectedHash, versionNote: 'Published from the TypeScript builder' },
    });
  }

  export function listRevisions(uuid: string): Promise<WooOptionsFic.RevisionRecord[]> {
    return request(`/option-sets/${uuid}/revisions`);
  }

  export function rollback(uuid: string, revisionUuid: string): Promise<WooOptionsFic.OptionSetRecord> {
    return request(`/option-sets/${uuid}/rollback`, { method: 'POST', data: { revisionUuid } });
  }

  export function getAssignments(uuid: string): Promise<{ items: WooOptionsFic.AssignmentRecord[] }> {
    return request(`/option-sets/${uuid}/assignments`);
  }

  export function saveAssignments(uuid: string, assignments: WooOptionsFic.AssignmentRecord[]): Promise<{ items: WooOptionsFic.AssignmentRecord[] }> {
    return request(`/option-sets/${uuid}/assignments`, { method: 'PUT', data: { assignments } });
  }

  export function searchAssignmentTargets(
    type: 'product' | 'variation' | 'category' | 'tag',
    search: string,
    include: number[] = [],
  ): Promise<{ items: WooOptionsFic.AssignmentTarget[] }> {
    const query = new URLSearchParams({ type, search, include: include.join(','), perPage: '25' });
    return request(`/assignment-targets?${query.toString()}`);
  }

  export function listTemplates(): Promise<{ items: WooOptionsFic.TemplateRecord[] }> {
    return request('/templates');
  }

  export function importTemplate(slug: string): Promise<WooOptionsFic.OptionSetRecord> {
    return request('/templates', { method: 'POST', data: { slug } });
  }

  export function exportOptionSet(uuid: string): Promise<Record<string, unknown>> {
    return request(`/exports/${uuid}`);
  }

  export function analytics(): Promise<Record<string, any>> {
    return request('/analytics');
  }

  export function integrations(): Promise<{ items: any[] }> {
    return request('/integrations');
  }

  export function diagnostics(): Promise<Record<string, any>> {
    return request('/diagnostics');
  }

  export function getSettings(): Promise<Record<string, any>> {
    return request('/settings');
  }

  export function saveSettings(settings: Record<string, unknown>): Promise<Record<string, any>> {
    return request('/settings', { method: 'PUT', data: settings });
  }
}
