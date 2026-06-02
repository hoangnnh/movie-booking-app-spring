import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LockKeyhole, LogIn, Menu, Moon, Search, Sun, X } from "lucide-react";
import { movieApi, notificationApi } from "../../api/api";
import { cn } from "../../utils/cn";
import {
    NOTIFICATIONS_UPDATED_EVENT,
    notifyNotificationsUpdated,
} from "../../utils/notificationEvents";
import Avatar from "../common/Avatar";
import Button from "../common/Button";
import Logo from "../common/Logo";
import SearchInput from "../common/SearchInput";

export default function Navbar({
    user = null,
    avatarSrc = "",
    variant = "solid",
    onLoginClick,
    onSignUpClick,
    onLogout,
    theme = "dark",
    onThemeToggle,
    showSearch = true,
    className = "",
}) {
    const isLoggedIn = Boolean(user);
    const resolvedAvatarSrc = avatarSrc || user?.avatarUrl || "";
    const nextThemeLabel = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
    const navigate = useNavigate();
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const searchInputRef = useRef(null);

    useEffect(() => {
        if (!searchOpen) {
            return;
        }

        window.setTimeout(() => {
            searchInputRef.current?.focus();
        }, 0);
    }, [searchOpen]);

    useEffect(() => {
        let ignore = false;

        async function loadSuggestions() {
            const normalizedSearch = searchTerm.trim();

            if (!searchOpen || normalizedSearch.length === 0) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            try {
                const data = await movieApi.autocomplete(normalizedSearch);

                if (!ignore) {
                    const nextSuggestions = Array.isArray(data) ? data : [];
                    setSuggestions(nextSuggestions);
                    setShowSuggestions(nextSuggestions.length > 0);
                }
            } catch {
                if (!ignore) {
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            }
        }

        loadSuggestions();

        return () => {
            ignore = true;
        };
    }, [searchOpen, searchTerm]);

    function closeSearch() {
        setSearchOpen(false);
        setShowSuggestions(false);
    }

    function closeMobileMenu() {
        setMobileMenuOpen(false);
    }

    function submitSearch(nextQuery = searchTerm) {
        const normalizedQuery = nextQuery.trim();

        closeSearch();
        closeMobileMenu();

        if (normalizedQuery.length === 0) {
            navigate("/movies/showing-now");
            return;
        }

        navigate(`/movies/showing-now?query=${encodeURIComponent(normalizedQuery)}`);
    }

    return (
        <header
            className={cn(
                variant === "overlay"
                    ? "absolute left-0 top-0 z-30 w-full bg-transparent"
                    : "w-full bg-app-background",
                variant === "bordered" && "rounded-card border border-app-border",
                className
            )}
        >
            <div className={cn("ticketor-container py-[12px]", variant === "overlay" && "pt-[18px]")}>
                <div
                    className={cn(
                        "flex items-center justify-between gap-[12px]",
                        variant === "overlay" &&
                            "ticketor-overlay-nav mx-auto max-w-[980px] rounded-tk-8 border px-[22px] py-[8px] shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-md",
                        variant === "overlay" &&
                            (theme === "light"
                                ? "ticketor-overlay-nav-light border-[#d8cfbc]/90 bg-[#fffdf8]/92"
                                : "border-white/10 bg-[#03040a]/95")
                    )}
                >
                    <Link to="/" onClick={closeMobileMenu}>
                        <Logo />
                    </Link>

                    <nav className="hidden items-center gap-[28px] xl:flex">
                        <NavbarDropdown
                            label="Movies"
                            items={[
                                { label: "Showing Now", to: "/movies/showing-now" },
                                { label: "Coming Soon", to: "/movies/coming-soon" },
                            ]}
                        />
                        <NavbarDropdown
                            label="Cinemas"
                            to="/cinemas"
                            items={[
                                { label: "All Theaters", to: "/cinemas" },
                                { label: "3D Theaters", to: "/cinemas?type=3d" },
                                { label: "Special Theaters", to: "/cinemas?type=special" },
                            ]}
                        />
                        {isLoggedIn && <NavbarLink to="/my-booking">My Booking</NavbarLink>}
                        {user?.role === "ADMIN" && <NavbarLink to="/admin">Admin</NavbarLink>}
                    </nav>

                    <div className="flex items-center gap-[8px] sm:gap-[14px]">
                        <Button
                            variant="text"
                            size={40}
                            iconOnly
                            onClick={onThemeToggle}
                            aria-label={nextThemeLabel}
                            title={nextThemeLabel}
                            rightIcon={theme === "dark" ? <Sun /> : <Moon />}
                        />

                        {showSearch && <div className="relative">
                            <Button
                                variant="text"
                                size={40}
                                iconOnly
                                rightIcon={<Search />}
                                onClick={() => {
                                    setSearchOpen((current) => !current);
                                    setMobileMenuOpen(false);
                                }}
                                aria-label="Open movie search"
                                title="Search movies"
                            />

                        {searchOpen && (
                            <div className="absolute right-0 top-[calc(100%+12px)] z-40 w-[min(92vw,420px)] rounded-tk-12 border border-app-border bg-app-surface p-[14px] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        submitSearch();
                                    }}
                                >
                                    <div className="flex items-center gap-[10px]">
                                        <SearchInput
                                            ref={searchInputRef}
                                            value={searchTerm}
                                            onChange={(event) => setSearchTerm(event.target.value)}
                                            onFocus={() => setShowSuggestions(suggestions.length > 0)}
                                            onBlur={() => {
                                                window.setTimeout(() => {
                                                    setShowSuggestions(false);
                                                }, 120);
                                            }}
                                            placeholder="Search movies by title"
                                            className="flex-1"
                                        />

                                        <Button
                                            variant="text"
                                            size={40}
                                            iconOnly
                                            rightIcon={<X />}
                                            onClick={closeSearch}
                                            aria-label="Close movie search"
                                            title="Close search"
                                        />
                                    </div>
                                </form>

                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="mt-[10px] overflow-hidden rounded-tk-8 border border-app-border bg-app-background">
                                        {suggestions.map((movie) => (
                                            <button
                                                key={movie.id}
                                                type="button"
                                                onMouseDown={() => submitSearch(movie.title || "")}
                                                className="flex w-full items-center justify-between gap-[16px] border-b border-app-border px-[14px] py-[12px] text-left transition-colors last:border-b-0 hover:bg-app-surface"
                                            >
                                                <span className="type-body-s text-app-text">
                                                    {movie.title || "Untitled Movie"}
                                                </span>
                                                <span className="type-body-xs text-app-text-muted">
                                                    {movie.releaseDate
                                                        ? new Date(movie.releaseDate).getFullYear()
                                                        : "TBA"}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-[12px] flex items-center justify-between gap-[12px]">
                                    <p className="type-body-xs text-app-text-muted">
                                        Press Enter to open the full movie results page.
                                    </p>
                                    <Button
                                        size={32}
                                        variant="primary"
                                        onClick={() => submitSearch()}
                                    >
                                        Search
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>}

                        {isLoggedIn && <NotificationBell userId={user.userId} />}

                        <div className="hidden h-[24px] w-px bg-app-border xl:block" />

                        {isLoggedIn ? (
                        <div className="group relative hidden xl:block">
                            <button
                                type="button"
                                className="flex min-w-0 max-w-[220px] items-center gap-[12px] text-app-text transition-colors hover:text-brand"
                            >
                                <Avatar size={40} src={resolvedAvatarSrc} alt={user.fullName} />
                                <span className="min-w-0 flex-1 truncate whitespace-nowrap type-body-m">
                                    Hello, {user.fullName}
                                </span>
                                <ChevronDown className="h-[20px] w-[20px] shrink-0" />
                            </button>

                            <div className="invisible absolute right-0 top-full z-30 min-w-[180px] pt-[12px] opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
                                <div className="rounded-tk-8 border border-app-border bg-app-surface p-[8px] shadow-xl">
                                    <Link
                                        to="/profile"
                                        className="block w-full rounded-tk-4 px-[12px] py-[10px] text-left type-body-s text-app-text-muted transition-colors hover:bg-app-background hover:text-brand"
                                    >
                                        Profile Settings
                                    </Link>
                                    <Link
                                        to="/my-booking"
                                        className="block w-full rounded-tk-4 px-[12px] py-[10px] text-left type-body-s text-app-text-muted transition-colors hover:bg-app-background hover:text-brand"
                                    >
                                        My Booking
                                    </Link>
                                    {user?.role === "ADMIN" && (
                                        <Link
                                            to="/admin"
                                            className="block w-full rounded-tk-4 px-[12px] py-[10px] text-left type-body-s text-app-text-muted transition-colors hover:bg-app-background hover:text-brand"
                                        >
                                            Admin Dashboard
                                        </Link>
                                    )}
                                    <button
                                        type="button"
                                        className="w-full rounded-tk-4 px-[12px] py-[10px] text-left type-body-s text-app-text-muted transition-colors hover:bg-app-background hover:text-brand"
                                        onClick={onLogout}
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="hidden items-center gap-[24px] xl:flex">
                            <button
                                type="button"
                                onClick={onLoginClick}
                                className="flex items-center gap-[8px] text-app-text transition-colors hover:text-brand"
                            >
                                <LockKeyhole className="h-[20px] w-[20px]" />
                                <span className="type-button-l">Login</span>
                            </button>

                            <button
                                type="button"
                                onClick={onSignUpClick}
                                className="flex items-center gap-[8px] text-brand transition-colors hover:text-brand-hover"
                            >
                                <LogIn className="h-[22px] w-[22px]" />
                                <span className="type-button-l">Sign Up</span>
                            </button>
                        </div>
                    )}

                        <Button
                            variant="text"
                            size={40}
                            iconOnly
                            className="xl:hidden"
                            rightIcon={mobileMenuOpen ? <X /> : <Menu />}
                            onClick={() => {
                                setMobileMenuOpen((current) => !current);
                                closeSearch();
                            }}
                            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                            title={mobileMenuOpen ? "Close menu" : "Open menu"}
                        />
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="mt-[12px] rounded-tk-12 border border-app-border bg-app-surface p-[14px] xl:hidden">
                        <nav className="grid gap-[6px]">
                            <MobileMenuLabel>Movies</MobileMenuLabel>
                            <MobileNavLink to="/movies/showing-now" onNavigate={closeMobileMenu}>Showing Now</MobileNavLink>
                            <MobileNavLink to="/movies/coming-soon" onNavigate={closeMobileMenu}>Coming Soon</MobileNavLink>
                            <MobileNavLink to="/cinemas" onNavigate={closeMobileMenu}>Cinemas</MobileNavLink>
                            <MobileNavLink to="/cinemas?type=3d" onNavigate={closeMobileMenu}>3D Theaters</MobileNavLink>
                            <MobileNavLink to="/cinemas?type=special" onNavigate={closeMobileMenu}>Special Theaters</MobileNavLink>
                            {isLoggedIn && (
                                <MobileNavLink to="/profile" onNavigate={closeMobileMenu}>Profile Settings</MobileNavLink>
                            )}
                            {isLoggedIn && (
                                <MobileNavLink to="/my-booking" onNavigate={closeMobileMenu}>My Booking</MobileNavLink>
                            )}
                            {user?.role === "ADMIN" && (
                                <MobileNavLink to="/admin" onNavigate={closeMobileMenu}>Admin</MobileNavLink>
                            )}
                        </nav>

                        <div className="mt-[12px] border-t border-app-border pt-[12px]">
                            {isLoggedIn ? (
                                <div className="grid gap-[10px]">
                                    <div className="flex items-center gap-[10px] rounded-tk-8 bg-app-background px-[12px] py-[10px]">
                                        <Avatar size={40} src={resolvedAvatarSrc} alt={user.fullName} />
                                        <div className="min-w-0">
                                            <p className="type-body-s truncate text-app-text">{user.fullName}</p>
                                            <p className="type-body-xs truncate text-app-text-muted">{user.email}</p>
                                        </div>
                                    </div>
                                    <Button
                                        size={40}
                                        variant="outline"
                                        tone="base"
                                        className="w-full"
                                        onClick={() => {
                                            closeMobileMenu();
                                            onLogout?.();
                                        }}
                                    >
                                        Logout
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid gap-[10px] sm:grid-cols-2">
                                    <Button
                                        size={40}
                                        variant="outline"
                                        tone="base"
                                        className="w-full"
                                        onClick={() => {
                                            closeMobileMenu();
                                            onLoginClick?.();
                                        }}
                                    >
                                        Login
                                    </Button>
                                    <Button
                                        size={40}
                                        className="w-full"
                                        onClick={() => {
                                            closeMobileMenu();
                                            onSignUpClick?.();
                                        }}
                                    >
                                        Sign Up
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}

function NotificationBell({ userId }) {
    const notificationContainerRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const loadNotifications = useCallback(async () => {
        try {
            const data = await notificationApi.getAll();
            setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
            setUnreadCount(Number(data?.unreadCount) || 0);
        } catch {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(loadNotifications, 0);

        window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, loadNotifications);

        return () => {
            window.clearTimeout(timeoutId);
            window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, loadNotifications);
        };
    }, [loadNotifications, userId]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        function closeOnOutsideClick(event) {
            if (!notificationContainerRef.current?.contains(event.target)) {
                setOpen(false);
            }
        }

        document.addEventListener("pointerdown", closeOnOutsideClick);

        return () => {
            document.removeEventListener("pointerdown", closeOnOutsideClick);
        };
    }, [open]);

    async function markRead(notification) {
        setOpen(false);

        if (notification.read) {
            return;
        }

        try {
            await notificationApi.markRead(notification.id);
            setNotifications((current) =>
                current.map((item) =>
                    item.id === notification.id ? { ...item, read: true } : item
                )
            );
            setUnreadCount((current) => Math.max(0, current - 1));
            notifyNotificationsUpdated();
        } catch {
            loadNotifications();
        }
    }

    async function markAllRead() {
        try {
            await notificationApi.markAllRead();
            setNotifications((current) =>
                current.map((notification) => ({ ...notification, read: true }))
            );
            setUnreadCount(0);
            notifyNotificationsUpdated();
        } catch {
            loadNotifications();
        }
    }

    return (
        <div ref={notificationContainerRef} className="relative">
            <Button
                variant="text"
                size={40}
                iconOnly
                rightIcon={<Bell />}
                onClick={() => {
                    setOpen((current) => !current);
                    loadNotifications();
                }}
                aria-label="Open notifications"
                title="Notifications"
            />
            {unreadCount > 0 && (
                <span className="pointer-events-none absolute right-[1px] top-[1px] flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-brand px-[4px] text-[10px] font-bold text-black">
                    {unreadCount > 9 ? "9+" : unreadCount}
                </span>
            )}

            {open && (
                <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(92vw,380px)] overflow-hidden rounded-tk-12 border border-app-border bg-app-surface shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
                    <div className="flex items-center justify-between gap-[12px] border-b border-app-border px-[16px] py-[14px]">
                        <div>
                            <p className="type-body-m font-bold text-app-text">Notifications</p>
                            <p className="type-body-xs text-app-text-muted">
                                {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={markAllRead}
                                className="type-body-xs font-bold text-brand transition-colors hover:text-brand-hover"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[420px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="px-[16px] py-[24px] text-center type-body-s text-app-text-muted">
                                No notifications yet.
                            </p>
                        ) : (
                            notifications.map((notification) => (
                                <Link
                                    key={notification.id}
                                    to={notification.actionUrl || "/profile"}
                                    onClick={() => markRead(notification)}
                                    className={cn(
                                        "block border-b border-app-border px-[16px] py-[14px] transition-colors last:border-b-0 hover:bg-app-background",
                                        !notification.read && "bg-brand/5"
                                    )}
                                >
                                    <div className="flex items-start gap-[10px]">
                                        <span
                                            className={cn(
                                                "mt-[6px] h-[8px] w-[8px] shrink-0 rounded-full",
                                                notification.read ? "bg-app-border" : "bg-brand"
                                            )}
                                        />
                                        <div className="min-w-0">
                                            <p className="type-body-s font-bold text-app-text">{notification.title}</p>
                                            <p className="mt-[3px] type-body-xs text-app-text-muted">{notification.message}</p>
                                            <p className="mt-[6px] text-[11px] text-app-text-subtle">
                                                {formatNotificationTime(notification.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function formatNotificationTime(value) {
    if (!value) {
        return "";
    }

    return new Date(value).toLocaleString();
}

function NavbarLink({ to, children }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    "cursor-pointer type-body-m transition-colors",
                    "whitespace-nowrap",
                    isActive ? "text-brand" : "text-app-text hover:text-brand"
                )
            }
        >
            {children}
        </NavLink>
    );
}

function NavbarDropdown({ label, to, items }) {
    return (
        <div className="group relative">
            {to ? (
                <NavLink
                    to={to}
                    className={({ isActive }) =>
                        cn(
                            "cursor-pointer whitespace-nowrap type-body-m transition-colors",
                            isActive ? "text-brand" : "text-app-text hover:text-brand"
                        )
                    }
                >
                    {label}
                </NavLink>
            ) : (
                <button
                    type="button"
                    className="cursor-default whitespace-nowrap type-body-m text-app-text transition-colors group-hover:text-brand"
                >
                    {label}
                </button>
            )}

            <div className="invisible absolute left-1/2 top-full z-40 w-[196px] -translate-x-1/2 pt-[16px] opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100">
                <div className="rounded-tk-4 border border-[#565669] bg-[#24242c] p-[6px] shadow-[0_18px_40px_rgba(0,0,0,0.36)]">
                    {items.map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            className="block cursor-pointer rounded-tk-4 px-[12px] py-[10px] type-body-s font-bold text-[#f1f1f3] transition-colors hover:bg-white/10 hover:text-[#fbfb1e]"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

function MobileMenuLabel({ children }) {
    return (
        <p className="px-[12px] pt-[8px] type-label-s text-app-text-subtle">
            {children}
        </p>
    );
}

function MobileNavLink({ to, children, onNavigate }) {
    return (
        <NavLink
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
                cn(
                    "cursor-pointer rounded-tk-8 px-[12px] py-[12px] type-body-s transition-colors",
                    isActive
                        ? "bg-app-background text-brand"
                        : "text-app-text-muted hover:bg-app-background hover:text-brand"
                )
            }
        >
            {children}
        </NavLink>
    );
}
