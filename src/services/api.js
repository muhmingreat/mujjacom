import { CloudSnow } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options = {}) {
  const { headers = {}, ...rest } = options;

  const isFormData = rest.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers
    }
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      payload.message || `Request failed (${response.status})`
    );

    error.status = response.status;
    error.code = payload.code;

    throw error;
  }

  return payload;
}

export const api = {
  // Health
  health: () => request("/health"),

  // Public properties
  getProperties: (params = {}) => {
    const query = new URLSearchParams(params).toString();

    return request(`/properties${query ? `?${query}` : ""}`);
  },

  getProperty: (id) =>
    request(`/properties/${encodeURIComponent(id)}`),

  // Property creation
  createProperty: (data, token) =>
    request("/properties", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }),

  // Property media uploads
  uploadPropertyImages: (propertyId, files, token) => {
    const formData = new FormData();

    Array.from(files).forEach((file) => {
      formData.append("images", file);
    });

    return request(
      `/properties/mine/${encodeURIComponent(propertyId)}/images`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      }
    );
  },

  uploadPropertyVideos: (propertyId, files, token) => {
    const formData = new FormData();

    Array.from(files).forEach((file) => {
      formData.append("videos", file);
    });

    return request(
      `/properties/mine/${encodeURIComponent(propertyId)}/videos`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      }
    );
  },

  // Member property management
  deleteMyProperty: (propertyId, token) =>
    request(`/properties/mine/${encodeURIComponent(propertyId)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  getMyProperties: (token) =>
    request("/properties/mine", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  getMyProperty: (propertyId, token) =>
    request(`/properties/mine/${encodeURIComponent(propertyId)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }, console.log(propertyId)),
    

  updateMyProperty: (propertyId, data, token) =>
    request(`/properties/mine/${encodeURIComponent(propertyId)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }),

  submitMyProperty: (propertyId, token) =>
    request(`/properties/mine/${encodeURIComponent(propertyId)}/submit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  // Authentication
  register: (data) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  login: (data) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      
    }),

  getMe: (token) =>
    request("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },console.log( token)),

  verifyEmail: (token) =>
    request("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token })
    }),

  resendVerificationEmail: (email) =>
    request("/auth/resend-verification-email", {
      method: "POST",
      body: JSON.stringify({ email })
    }),

  updateProfile: (data, token) =>
    request("/auth/profile", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }),

  changePassword: (data, token) =>
    request("/auth/change-password", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }),

  forgotPassword: (data) =>
    request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  resetPassword: (data) =>
    request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  // Saved properties
  getSavedProperties: (token) =>
    request("/saved-properties", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  saveProperty: (propertyId, token) =>
    request(`/saved-properties/${encodeURIComponent(propertyId)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  unsaveProperty: (propertyId, token) =>
    request(`/saved-properties/${encodeURIComponent(propertyId)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  // Property applications
  createApplication: (propertyId, data, token) =>
    request(`/applications/property/${encodeURIComponent(propertyId)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }),

  getMyApplications: (token) =>
    request("/applications/mine", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  getMyApplication: (applicationId, token) =>
    request(`/applications/mine/${encodeURIComponent(applicationId)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  withdrawApplication: (applicationId, token) =>
    request(`/applications/mine/${encodeURIComponent(applicationId)}/withdraw`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  // Admin property reviews
  getPendingProperties: (token) =>
    request("/admin/properties/pending", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  getAllAdminProperties: (params = {}, token) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(
        ([, value]) =>
          value !== "" &&
          value !== null &&
          value !== undefined
      )
    ).toString();

    return request(`/admin/properties${query ? `?${query}` : ""}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  getAdminProperty: (propertyId, token) =>
    request(`/admin/properties/${encodeURIComponent(propertyId)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  approveProperty: (propertyId, token) =>
    request(`/admin/properties/${encodeURIComponent(propertyId)}/approve`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  rejectProperty: (propertyId, reviewNote, token) =>
    request(`/admin/properties/${encodeURIComponent(propertyId)}/reject`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ reviewNote })
    }),

  // Admin property lifecycle management
  archiveProperty: (propertyId, token) =>
    request(`/admin/properties/${encodeURIComponent(propertyId)}/archive`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  restoreArchivedProperty: (propertyId, token) =>
    request(`/admin/properties/${encodeURIComponent(propertyId)}/restore`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  unpublishProperty: (propertyId, token) =>
    request(`/admin/properties/${encodeURIComponent(propertyId)}/unpublish`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  republishProperty: (propertyId, token) =>
    request(`/admin/properties/${encodeURIComponent(propertyId)}/republish`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  // Admin estate management
  getAllAdminEstates: (params = {}, token) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(
        ([, value]) =>
          value !== "" &&
          value !== null &&
          value !== undefined
      )
    ).toString();

    return request(`/admin/estates${query ? `?${query}` : ""}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  // getAdminEstate: (estateId, token) =>
  //   request(`/admin/estates/${encodeURIComponent(estateId)}`, {
  //     headers: {
  //       Authorization: `Bearer ${token}`
  //     }
  //   }),

  getAdminEstate: (estateId, token) =>
  request(`/admin/estates/${encodeURIComponent(estateId)}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`
    }
  }),

  createAdminEstate: (data, token) =>
    request("/admin/estates", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }),

  updateAdminEstate: (estateId, data, token) =>
    request(`/admin/estates/${encodeURIComponent(estateId)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }),

  publishAdminEstate: (estateId, token) =>
    request(`/admin/estates/${encodeURIComponent(estateId)}/publish`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  archiveAdminEstate: (estateId, token) =>
    request(`/admin/estates/${encodeURIComponent(estateId)}/archive`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  restoreAdminEstate: (estateId, token) =>
    request(`/admin/estates/${encodeURIComponent(estateId)}/restore`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),
  // Admin application management
  getAllAdminApplications: (params = {}, token) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(
        ([, value]) =>
          value !== "" &&
          value !== null &&
          value !== undefined
      )
    ).toString();

    return request(`/admin/applications${query ? `?${query}` : ""}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  getAdminApplication: (applicationId, token) =>
    request(`/admin/applications/${encodeURIComponent(applicationId)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  updateAdminApplication: (applicationId, data, token) =>
    request(`/admin/applications/${encodeURIComponent(applicationId)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }),

  // Admin member management
  getAllAdminMembers: (params = {}, token) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(
        ([, value]) =>
          value !== "" &&
          value !== null &&
          value !== undefined
      )
    ).toString();

    return request(`/admin/members${query ? `?${query}` : ""}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  getAdminMemberStats: (token) =>
    request("/admin/members/stats", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  getAdminMember: (memberId, token) =>
    request(`/admin/members/${encodeURIComponent(memberId)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  updateAdminMemberStatus: (memberId, data, token) =>
    request(`/admin/members/${encodeURIComponent(memberId)}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }),

  getAdminMemberAuditHistory: (memberId, params = {}, token) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(
        ([, value]) =>
          value !== "" &&
          value !== null &&
          value !== undefined
      )
    ).toString();

    return request(
      `/admin/members/${encodeURIComponent(memberId)}/audit-history${query ? `?${query}` : ""}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  },

  // Member transactions
  getMyTransactions: (params = {}, token) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(
        ([, value]) =>
          value !== "" &&
          value !== null &&
          value !== undefined
      )
    ).toString();

    return request(`/transactions/mine${query ? `?${query}` : ""}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  getMyTransaction: (transactionId, token) =>
    request(`/transactions/mine/${encodeURIComponent(transactionId)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  // Admin transactions
  getAllAdminTransactions: (params = {}, token) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(
        ([, value]) =>
          value !== "" &&
          value !== null &&
          value !== undefined
      )
    ).toString();

    return request(`/admin/transactions${query ? `?${query}` : ""}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  createAdminTransaction: (applicationId, data, token) =>
    request(`/admin/transactions/application/${encodeURIComponent(applicationId)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }),

  getAdminTransaction: (transactionId, token) =>
    request(`/admin/transactions/${encodeURIComponent(transactionId)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  updateAdminTransactionStatus: (transactionId, data, token) =>
    request(`/admin/transactions/${encodeURIComponent(transactionId)}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }),

  // Admin transaction agreements
  getAdminTransactionAgreements: (transactionId, token) =>
    request(
      `/admin/transactions/${encodeURIComponent(transactionId)}/agreements`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ),

  createAdminTransactionAgreement: (transactionId, data, token) =>
    request(
      `/admin/transactions/${encodeURIComponent(transactionId)}/agreement`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      }
    ),

  publishAdminTransactionAgreement: (transactionId, agreementId, token) =>
    request(
      `/admin/transactions/${encodeURIComponent(transactionId)}/agreement/${encodeURIComponent(agreementId)}/publish`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ),

  // Member transaction agreements
  getMyTransactionAgreement: (transactionId, token) =>
    request(
      `/transactions/mine/${encodeURIComponent(transactionId)}/agreement`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ),

  respondToTransactionAgreement: (transactionId, agreementId, data, token) =>
    request(
      `/transactions/mine/${encodeURIComponent(transactionId)}/agreement/${encodeURIComponent(agreementId)}/respond`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      }
    ),

  supersedeAdminTransactionAgreement: (transactionId, agreementId, token) =>
    request(
      `/admin/transactions/${encodeURIComponent(transactionId)}/agreement/${encodeURIComponent(agreementId)}/supersede`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ),

  // Member transaction payments
  submitTransactionPayment: (transactionId, data, token) =>
    request(
      `/transaction-payments/${encodeURIComponent(transactionId)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: data instanceof FormData ? data : JSON.stringify(data)
      }
    ),

  getMyTransactionPayments: (transactionId, token) =>
    request(
      `/transaction-payments/${encodeURIComponent(transactionId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ),

  // Admin transaction payments
  getAdminTransactionPayments: (transactionId, token) =>
    request(
      `/admin/transactions/${encodeURIComponent(transactionId)}/payments`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ),

  reviewAdminTransactionPayment: (
    transactionId,
    paymentId,
    data,
    token
  ) =>
    request(
      `/admin/transactions/${encodeURIComponent(transactionId)}/payments/${encodeURIComponent(paymentId)}/review`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      }
    ),

      // Member property due diligence
  getMyDueDiligenceCases: (token) =>
    request("/due-diligence/mine", {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getMyDueDiligenceCase: (propertyId, token) =>
    request(`/due-diligence/mine/property/${encodeURIComponent(propertyId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  uploadMyDueDiligenceDocument: (propertyId, formData, token) =>
    request(`/due-diligence/mine/property/${encodeURIComponent(propertyId)}/documents`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    }),

  getMyDueDiligenceDocumentAccess: (caseId, documentId, token) =>
    request(`/due-diligence/mine/${encodeURIComponent(caseId)}/documents/${
      encodeURIComponent(documentId)}/access`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
    
  // Admin property due diligence
  getAdminDueDiligenceCases: (token, params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(
        ([, value]) => value !== "" && value !== null && value !== undefined
      )
    ).toString();

    return request(
      `/due-diligence/admin${query ? `?${query}` : ""}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },

  getAdminDueDiligenceCase: (caseId, token) =>
    request(`/due-diligence/admin/${encodeURIComponent(caseId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  getAdminDueDiligenceDocumentAccess: (caseId, documentId, token) =>
    request(
      `/due-diligence/admin/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(documentId)}/access`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    ),

  reviewAdminDueDiligenceDocument: (
    caseId,
    documentId,
    data,
    token
  ) =>
    request(
      `/due-diligence/admin/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(documentId)}/review`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    ),

    uploadAdminEstateCover: (estateId, file, token) => {
  const formData = new FormData();

  formData.append("coverImage", file);

  return request(
    `/admin/estates/${encodeURIComponent(estateId)}/cover-image`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    }
  );
},

  // Public estate showcase
  getPublicEstates: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(
        ([, value]) =>
          value !== "" &&
          value !== null &&
          value !== undefined
      )
    ).toString();

    return request(`/estates${query ? `?${query}` : ""}`);
  },

  getPublicEstate: (slug) =>
    request(`/estates/${encodeURIComponent(slug)}`),
    cache: "no-store",

    uploadAdminEstateGalleryImages: (estateId, files, token) => {
    const formData = new FormData();

    Array.from(files).forEach((file) => {
      formData.append("images", file);
    });

    return request(
      `/admin/estates/${encodeURIComponent(estateId)}/gallery/images`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );
  },

  uploadAdminEstateGalleryVideos: (estateId, files, token) => {
    const formData = new FormData();

    Array.from(files).forEach((file) => {
      formData.append("videos", file);
    });

    return request(
      `/admin/estates/${encodeURIComponent(estateId)}/gallery/videos`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );
  },

  deleteAdminEstateGalleryMedia: (estateId, mediaId, token) =>
    request(
      `/admin/estates/${encodeURIComponent(estateId)}/gallery/${encodeURIComponent(mediaId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    ),

};

