import { NavLink } from "react-router-dom";
import { ChevronDown, ChevronRight, type LucideIcon } from "lucide-react";
import logoMark from "../assets/images/logo-4t.png";
import { BRAND_NAME, ADMIN_APP_NAME } from "../config/businessProfile";

export type NavGroupId = "overview" | "commerce" | "service" | "system";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  group: NavGroupId;
};

interface SidebarProps {
  mobile?: boolean;
  openGroups: Record<NavGroupId, boolean>;
  toggleGroup: (group: NavGroupId) => void;
  groupedNav: Array<{
    id: NavGroupId;
    label: string;
    items: NavItem[];
  }>;
  navBadges: Record<string, number>;
  user: { username: string } | null;
  copy: {
    openNavigation: string;
    workspace: string;
    account: string;
    online: string;
  };
  mobileNavigationId: string;
}

export const Sidebar = ({
  mobile = false,
  openGroups,
  toggleGroup,
  groupedNav,
  navBadges,
  user,
  copy,
  mobileNavigationId,
}: SidebarProps) => {
  return (
    <aside
      id={mobile ? mobileNavigationId : undefined}
      aria-label={copy.openNavigation}
      className={
        mobile
          ? "brand-admin-shell flex h-full min-h-0 flex-col gap-4 border-r border-[var(--brand-border)] px-4 py-4 text-white"
          : "brand-admin-shell hidden min-h-0 flex-col gap-4 border-r border-[var(--brand-border)] px-4 py-4 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[296px] lg:shrink-0 xl:w-[320px]"
      }
    >
      <div className="flex items-center gap-3">
        <img
          src={logoMark}
          alt={BRAND_NAME}
          className="h-10 w-auto max-w-[152px] object-contain drop-shadow-[0_10px_24px_rgba(0,113,188,0.22)]"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.01em] text-white">
            {ADMIN_APP_NAME}
          </div>
          <p className="text-xs text-white/60">{copy.workspace}</p>
        </div>
      </div>

      <nav className="app-scroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
        {groupedNav.map((group) => (
          <section
            key={group.id}
            className="rounded-[22px] border border-[var(--brand-border)] bg-[rgba(41,171,226,0.05)] px-2 py-2"
          >
            <button
              aria-expanded={openGroups[group.id]}
              className="flex w-full items-center justify-between gap-3 px-2.5 py-1.5 text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60"
              onClick={() => toggleGroup(group.id)}
              type="button"
            >
              <span>{group.label}</span>
              <span className="inline-flex items-center gap-2">
                <span className="rounded-full bg-[rgba(41,171,226,0.1)] px-2 py-0.5 text-[10px] text-white/75">
                  {group.items.length}
                </span>
                {openGroups[group.id] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </span>
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${
                openGroups[group.id] ? "max-h-[40rem]" : "max-h-0"
              }`}
            >
              <div className="mt-1.5 space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      className={({ isActive }) =>
                        [
                          "group relative flex min-h-[4.25rem] items-center gap-3 overflow-hidden rounded-[18px] px-3 py-2.5 text-left text-sm font-medium transition",
                          isActive
                            ? "bg-[linear-gradient(135deg,rgba(41,171,226,0.22),rgba(0,113,188,0.18))] text-white shadow-[inset_0_0_0_1px_rgba(41,171,226,0.38),0_14px_28px_rgba(3,16,28,0.16)]"
                            : "text-white/84 hover:bg-[rgba(41,171,226,0.1)] hover:text-white",
                        ].join(" ")
                      }
                      title={item.label}
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={[
                              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition",
                              isActive
                                ? "bg-[rgba(255,255,255,0.12)] text-white"
                                : "bg-[rgba(41,171,226,0.14)] text-blue-200",
                            ].join(" ")}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="line-clamp-2 block min-w-0 flex-1 pr-1 text-sm leading-5 text-inherit break-words">
                            {item.label}
                          </span>
                          {navBadges[item.to] ? (
                            <span
                              aria-label={`${navBadges[item.to]} mục cần xử lý`}
                              className="inline-flex min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-[var(--destructive)] px-1.5 py-0.5 text-[0.7rem] font-semibold leading-none text-white"
                            >
                              {navBadges[item.to] > 99 ? "99+" : navBadges[item.to]}
                            </span>
                          ) : null}
                          <ChevronRight
                            className={[
                              "h-4 w-4 shrink-0 self-center transition",
                              isActive
                                ? "translate-x-0 text-white/70"
                                : "text-white/45 group-hover:translate-x-0.5 group-hover:text-white/75",
                            ].join(" ")}
                          />
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </section>
        ))}
      </nav>

      <div className="text-xs text-white/60">
        <div className="rounded-[18px] border border-[var(--brand-border)] bg-[rgba(41,171,226,0.05)] px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                {copy.account}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-white">
                {user?.username ?? "Admin"}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[rgba(34,197,94,0.12)] px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(34,197,94,0.16)]" />
              {copy.online}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
