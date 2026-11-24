import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  MailWarning,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Eye,
  X,
  Clock,
  Phone,
  Mail,
  CalendarDays,
} from "lucide-react";

import { api } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

const initialStats = {
  total: 0,
  active: 0,
  suspended: 0,
  deactivated: 0,
  unverified: 0,
};

function formatDate(date) {
  if (!date) return "Not available";

  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(member) {
  return `${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}`.toUpperCase();
}

function StatusBadge({ status }) {
  const styles = {
    active: "bg-green-100 text-green-700",
    suspended: "bg-red-100 text-red-700",
    deactivated: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}

function VerificationBadge({ verified }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
      <ShieldCheck size={15} />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
      <ShieldAlert size={15} />
      Unverified
    </span>
  );
}

function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {value.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>

        <div className="rounded-xl bg-green-50 p-3 text-green-700">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function AdminMembers() {
  const { token } = useAuth();
  const { success, error: showError } = useToast();

  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(initialStats);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    emailVerified: "",
    sort: "newest",
  });

  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [reason, setReason] = useState("");

  const [auditHistory, setAuditHistory] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const [auditPagination, setAuditPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await api.getAdminMemberStats(token);
      setStats(response.stats || initialStats);
    } catch (error) {
      showError(error.message || "Unable to load member statistics.");
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.getAllAdminMembers(
        {
          ...filters,
          page: pagination.page,
          limit: pagination.limit,
        },
        token,
      );

      setMembers(response.data || []);
      setPagination((previous) => ({
        ...previous,
        ...(response.pagination || {}),
      }));
    } catch (error) {
      showError(error.message || "Unable to load members.");
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, token]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((previous) => ({
        ...previous,
        search: searchInput.trim(),
      }));
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const updateFilter = (name, value) => {
    setPagination((previous) => ({ ...previous, page: 1 }));
    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const changePage = (page) => {
    setPagination((previous) => ({
      ...previous,
      page,
    }));
  };

  //   const openMember = async member => {
  //     try {
  //       const response = await api.getAdminMember(member._id, token);
  //       setSelectedMember(response.member);
  //     } catch (error) {
  //       showError(error.message || "Unable to load member details.");
  //     }
  //   };

  const openMember = async (member) => {
    try {
      setAuditLoading(true);
      setAuditHistory([]);
      setSelectedMember(null);

      const [memberResponse, auditResponse] = await Promise.all([
        api.getAdminMember(member._id, token),
        api.getAdminMemberAuditHistory(
          member._id,
          { page: 1, limit: 10 },
          token,
        ),
      ]);

      setSelectedMember(memberResponse.member);
      setAuditHistory(auditResponse.data || []);

      setAuditPagination((previous) => ({
        ...previous,
        ...(auditResponse.pagination || {}),
      }));
    } catch (error) {
      showError(error.message || "Unable to load member details and activity.");
    } finally {
      setAuditLoading(false);
    }
  };

  const confirmStatusChange = async () => {
    if (!pendingAction) return;

    const { member, status } = pendingAction;

    try {
      setActionLoading(member._id);

      const response = await api.updateAdminMemberStatus(
        member._id,
        {
          accountStatus: status,
          reason,
        },
        token,
      );

      success(response.message || "Member account updated.");

      setPendingAction(null);
      setReason("");

      if (selectedMember?._id === member._id) {
        setSelectedMember((previous) => ({
          ...previous,
          accountStatus: status,
        }));
      }

      await Promise.all([loadMembers(), loadStats()]);
    } catch (error) {
      showError(error.message || "Unable to update member account.");
    } finally {
      setActionLoading("");
    }
  };

  const totalPages = pagination.totalPages || 0;

  return (
    <div className="space-y-7">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-green-700">
            Administration / Members
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            Member Management
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage member accounts, verification and account access.
          </p>
        </div>

        <button
          type="button"
          onClick={() => Promise.all([loadMembers(), loadStats()])}
          disabled={loading || statsLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Members"
          value={stats.total}
          icon={Users}
          description="Registered member accounts"
        />

        <StatCard
          title="Active Members"
          value={stats.active}
          icon={UserCheck}
          description="Accounts with active access"
        />

        <StatCard
          title="Suspended Members"
          value={stats.suspended}
          icon={UserX}
          description="Accounts with restricted access"
        />

        <StatCard
          title="Unverified Emails"
          value={stats.unverified}
          icon={MailWarning}
          description="Members awaiting email verification"
        />
      </div>

      {statsLoading && (
        <p className="text-xs text-gray-400">Refreshing statistics...</p>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative xl:col-span-2">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search name, email or phone..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <select
            value={filters.role}
            onChange={(event) => updateFilter("role", event.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
          >
            <option value="">All member roles</option>
            <option value="user">User</option>
            <option value="agent">Agent</option>
            <option value="developer">Developer</option>
          </select>

          <select
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
          >
            <option value="">All account statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deactivated">Deactivated</option>
          </select>

          <select
            value={filters.emailVerified}
            onChange={(event) =>
              updateFilter("emailVerified", event.target.value)
            }
            className="rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
          >
            <option value="">All verification statuses</option>
            <option value="true">Verified email</option>
            <option value="false">Unverified email</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            {pagination.total.toLocaleString()} members found
          </p>

          <select
            value={filters.sort}
            onChange={(event) => updateFilter("sort", event.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-600"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      {/* Members table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-bold text-gray-900">Registered Members</h2>
          <p className="mt-1 text-xs text-gray-500">
            Review member information and manage account access.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-gray-500">
            <RefreshCw size={18} className="animate-spin text-green-700" />
            Loading members...
          </div>
        ) : members.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <Users size={36} className="text-gray-300" />
            <h3 className="mt-4 font-semibold text-gray-800">
              No members found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Member</th>
                    <th className="px-5 py-4 font-semibold">Role</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Email</th>
                    <th className="px-5 py-4 font-semibold">Joined</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {members.map((member) => (
                    <tr
                      key={member._id}
                      className="transition hover:bg-gray-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-800">
                            {getInitials(member)}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">
                          {member.role}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={member.accountStatus} />
                      </td>

                      <td className="px-5 py-4">
                        <VerificationBadge verified={member.isEmailVerified} />
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDate(member.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openMember(member)}
                            title="View member"
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-green-300 hover:bg-green-50 hover:text-green-700"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            disabled={actionLoading === member._id}
                            onClick={() => {
                              setPendingAction({
                                member,
                                status:
                                  member.accountStatus === "suspended"
                                    ? "active"
                                    : "suspended",
                              });
                              setReason("");
                            }}
                            title={
                              member.accountStatus === "suspended"
                                ? "Reactivate member"
                                : "Suspend member"
                            }
                            className={`rounded-lg border p-2 transition disabled:opacity-50 ${
                              member.accountStatus === "suspended"
                                ? "border-green-200 text-green-700 hover:bg-green-50"
                                : "border-red-200 text-red-600 hover:bg-red-50"
                            }`}
                          >
                            {member.accountStatus === "suspended" ? (
                              <UserCheck size={16} />
                            ) : (
                              <UserX size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {Math.max(totalPages, 1)}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!pagination.hasPreviousPage || loading}
                  onClick={() => changePage(pagination.page - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={!pagination.hasNextPage || loading}
                  onClick={() => changePage(pagination.page + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Member details modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <h2 className="text-lg font-bold text-gray-900">
                Member Details
              </h2>

              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-800">
                  {getInitials(selectedMember)}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </h3>

                  <p className="text-sm capitalize text-gray-500">
                    {selectedMember.role}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={17} className="text-gray-400" />
                  <span className="break-all text-gray-700">
                    {selectedMember.email}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Phone size={17} className="text-gray-400" />
                  <span className="text-gray-700">
                    {selectedMember.phone || "No phone number"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <CalendarDays size={17} className="text-gray-400" />
                  <span className="text-gray-700">
                    Joined {formatDate(selectedMember.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Clock size={17} className="text-gray-400" />
                  <span className="text-gray-700">
                    Last login: {formatDate(selectedMember.lastLoginAt)}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-100 pt-5">
                <StatusBadge status={selectedMember.accountStatus} />
                <VerificationBadge verified={selectedMember.isEmailVerified} />
              </div>
              {/* Account Activity History */}
              <div className="mt-6 border-t border-gray-100 pt-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">
                      Account Activity History
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Administrative status changes and their reasons.
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {auditPagination.total} records
                  </span>
                </div>

                {auditLoading ? (
                  <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
                    <RefreshCw size={16} className="animate-spin" />
                    Loading activity history...
                  </div>
                ) : auditHistory.length === 0 ? (
                  <div className="rounded-xl bg-gray-50 px-4 py-6 text-center">
                    <Clock size={24} className="mx-auto text-gray-400" />
                    <p className="mt-2 text-sm font-medium text-gray-700">
                      No account activity yet
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Future suspensions and reactivations will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auditHistory.map((record) => (
                      <div
                        key={record._id}
                        className="rounded-xl border border-gray-100 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`text-sm font-bold capitalize ${
                              record.action === "suspended"
                                ? "text-red-600"
                                : "text-green-700"
                            }`}
                          >
                            Account {record.action}
                          </span>

                          <span className="text-xs text-gray-400">
                            {new Date(record.createdAt).toLocaleString("en-NG")}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                          <StatusBadge status={record.previousStatus} />
                          <span className="text-gray-400">→</span>
                          <StatusBadge status={record.newStatus} />
                        </div>

                        <div className="mt-3 space-y-2 text-sm">
                          <p className="text-gray-600">
                            **Administrator:**{" "}
                            {record.admin
                              ? `${record.admin.firstName} ${record.admin.lastName}`
                              : "Unavailable"}
                          </p>

                          <p className="text-gray-600">
                            **Reason:** {record.reason || "No reason provided"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {auditPagination.totalPages > 1 && (
  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
    <p className="text-xs text-gray-500">
      Page {auditPagination.page} of {auditPagination.totalPages}
    </p>

    <div className="flex gap-2">
      <button
        type="button"
        disabled={!auditPagination.hasPreviousPage || auditLoading}
        onClick={async () => {
          const nextPage = auditPagination.page - 1;

          try {
            setAuditLoading(true);

            const response = await api.getAdminMemberAuditHistory(
              selectedMember._id,
              { page: nextPage, limit: 10 },
              token
            );

            setAuditHistory(response.data || []);
            setAuditPagination(previous => ({
              ...previous,
              ...(response.pagination || {})
            }));
          } catch (error) {
            showError(error.message || "Unable to load previous activity.");
          } finally {
            setAuditLoading(false);
          }
        }}
        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-40"
      >
        Previous
      </button>

      <button
        type="button"
        disabled={!auditPagination.hasNextPage || auditLoading}
        onClick={async () => {
          const nextPage = auditPagination.page + 1;

          try {
            setAuditLoading(true);

            const response = await api.getAdminMemberAuditHistory(
              selectedMember._id,
              { page: nextPage, limit: 10 },
              token
            );

            setAuditHistory(response.data || []);
            setAuditPagination(previous => ({
              ...previous,
              ...(response.pagination || {})
            }));
          } catch (error) {
            showError(error.message || "Unable to load next activity.");
          } finally {
            setAuditLoading(false);
          }
        }}
        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  </div>
)}
            </div>

            <div className="flex justify-end border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend/reactivate confirmation */}
      {pendingAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {pendingAction.status === "suspended"
                    ? "Suspend member account?"
                    : "Reactivate member account?"}
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  {pendingAction.member.firstName}{" "}
                  {pendingAction.member.lastName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-gray-600">
              {pendingAction.status === "suspended"
                ? "This member will lose access to protected account features. Existing sessions will be invalidated."
                : "This member's account access will be restored. They will need to sign in again."}
            </p>

            <label className="mt-5 block text-sm font-semibold text-gray-700">
              Reason (optional)
            </label>

            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Enter a reason for this account action..."
              className="mt-2 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />

            <p className="mt-1 text-right text-xs text-gray-400">
              {reason.length}/1000
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                disabled={Boolean(actionLoading)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmStatusChange}
                disabled={Boolean(actionLoading)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
                  pendingAction.status === "suspended"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-700 hover:bg-green-800"
                }`}
              >
                {actionLoading
                  ? "Processing..."
                  : pendingAction.status === "suspended"
                    ? "Confirm suspension"
                    : "Confirm reactivation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
