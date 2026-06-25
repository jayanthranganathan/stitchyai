/**
 * Centralised endpoint table.
 *
 * Adding a new endpoint? Put it here so the mobile codebase has one place to grep.
 */
export const endpoints = {
  auth: {
    requestOtp: '/auth/otp/request',
    verifyOtp: '/auth/otp/verify',
    firebase: '/auth/firebase',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },
  subscriptions: {
    plans: '/subscriptions/plans',
    me: '/subscriptions/me',
    change: '/subscriptions/change',
  },
  credits: {
    balance: '/credits/balance',
    history: '/credits/history',
  },
  users: {
    me: '/users/me',
  },
  catalog: {
    categories: '/catalog/categories',
    designs: (slug: string) => `/catalog/categories/${slug}/designs`,
    proposals: '/catalog/proposals',
  },
  orders: {
    list: '/orders',
    create: '/orders',
    detail: (id: string) => `/orders/${id}`,
    progress: (id: string) => `/orders/${id}/progress`,
    cancel: (id: string) => `/orders/${id}/cancel`,
    attachments: (id: string) => `/orders/${id}/attachments`,
  },
  ai: {
    /** POST multipart/form-data { image } → { suggestions: FabricSuggestionGroup[] } */
    fabricScan: '/ai/fabric-scan',
    // ── AI Design Studio ────────────────────────────────────────────────────
    /** POST multipart/form-data { image } → FabricUploadResponse */
    fabricUpload: '/ai/fabric-upload',
    /** POST GenerateDesignsRequest → GenerateDesignsResponse (202 Accepted) */
    generateDesigns: '/ai/generate-designs',
    /** GET → GenerationJob (polled during generation) */
    generationStatus: (jobId: string) => `/ai/generation-status/${jobId}`,
    /** GET → GenerationJob with full designs array */
    results: (jobId: string) => `/ai/results/${jobId}`,
    /** POST RegenerateRequest → GenerateDesignsResponse */
    regenerate: '/ai/regenerate',
    /** POST { design_id } → { ok: true } */
    saveDesign: '/ai/save-design',
    /** DELETE /ai/save-design/:id */
    unsaveDesign: (designId: string) => `/ai/save-design/${designId}`,
    /** GET → GenerationJob[] (history) */
    history: '/ai/history',
  },
  tailors: {
    register: '/tailors/register',
    me: '/tailors/me',
    myOrders: '/tailors/me/orders',
    availableOrders: '/tailors/me/orders/available',
    interest: '/tailors/me/interests',
    progress: (id: string) => `/tailors/me/orders/${id}/progress`,
  },
  delivery: {
    register: '/delivery/register',
    me: '/delivery/me',
    status: '/delivery/me/status',
    assignments: '/delivery/me/assignments',
    transition: (id: string) => `/delivery/me/assignments/${id}`,
  },
  tracking: {
    pings: '/tracking/pings',
    snapshot: (orderId: string) => `/tracking/orders/${orderId}`,
  },
  admin: {
    orders: '/admin/orders',
    approvals: '/admin/approvals',
    approveOrder: (id: string) => `/admin/orders/${id}/approve`,
    approveTailor: (id: string) => `/admin/tailors/${id}/approve`,
    approveDelivery: (id: string) => `/admin/delivery/${id}/approve`,
    assignOrder: (id: string) => `/admin/orders/${id}/assign`,
    admins: '/admin/admins',
  },
  reports: {
    orders: '/reports/orders',
  },
  notifications: {
    inbox: '/notifications',
    devices: '/notifications/devices',
  },
} as const;
