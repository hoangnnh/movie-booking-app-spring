import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ChevronDown, LockKeyhole, LogIn, Menu, Moon, Search, Sun, X } from "lucide-react";
import { movieApi } from "../../api/api";
import { cn } from "../../utils/cn";
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
    className = "",
}) {
    const isLoggedIn = Boolean(user);
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
            navigate("/movies");
            return;
        }

        navigate(`/movies?query=${encodeURIComponent(normalizedQuery)}`);
    }

    return (
        <header
            className={cn(
                "w-full bg-app-background",
                variant === "bordered" && "rounded-card border border-app-border",
                className
            )}
        >
            <div className="ticketor-container py-[12px]">
                <div className="flex items-center justify-between gap-[12px]">
                    <Link to="/" onClick={closeMobileMenu}>
                        <Logo />
                    </Link>

                    <nav className="hidden items-center gap-[32px] xl:flex">
                        <NavbarLink to="/movies">Movies</NavbarLink>
                        {isLoggedIn && <NavbarLink to="/my-booking">My Booking</NavbarLink>}
                        {isLoggedIn && <NavbarLink to="/favorites">Favorites</NavbarLink>}
                        {user?.role === "ADMIN" && <NavbarLink to="/admin">Admin</NavbarLink>}
                    </nav>

                    <div className="flex items-center gap-[8px] sm:gap-[12px]">
                        <Button
                            variant="text"
                            size={40}
                            iconOnly
                            onClick={onThemeToggle}
                            aria-label={nextThemeLabel}
                            title={nextThemeLabel}
                            rightIcon={theme === "dark" ? <Sun /> : <Moon />}
                        />

                        <div className="relative">
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
                    </div>

                        <div className="hidden h-[24px] w-px bg-app-border xl:block" />

                        {isLoggedIn ? (
                        <div className="group relative hidden xl:block">
                            <button
                                type="button"
                                className="flex items-center gap-[12px] text-app-text transition-colors hover:text-brand"
                            >
                                <Avatar size={40} src={avatarSrc} alt={user.fullName} />
                                <span className="type-body-m">{user.fullName}</span>
                                <ChevronDown className="h-[20px] w-[20px]" />
                            </button>

                            <div className="invisible absolute right-0 top-full z-30 min-w-[180px] pt-[12px] opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
                                <div className="rounded-tk-8 border border-app-border bg-app-surface p-[8px] shadow-xl">
                                    <Link
                                        to="/my-booking"
                                        className="block w-full rounded-tk-4 px-[12px] py-[10px] text-left type-body-s text-app-text-muted transition-colors hover:bg-app-background hover:text-brand"
                                    >
                                        My Booking
                                    </Link>
                                    <Link
                                        to="/favorites"
                                        className="block w-full rounded-tk-4 px-[12px] py-[10px] text-left type-body-s text-app-text-muted transition-colors hover:bg-app-background hover:text-brand"
                                    >
                                        Favorites
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
                            <MobileNavLink to="/movies" onNavigate={closeMobileMenu}>Movies</MobileNavLink>
                            {isLoggedIn && (
                                <MobileNavLink to="/my-booking" onNavigate={closeMobileMenu}>My Booking</MobileNavLink>
                            )}
                            {isLoggedIn && (
                                <MobileNavLink to="/favorites" onNavigate={closeMobileMenu}>Favorites</MobileNavLink>
                            )}
                            {user?.role === "ADMIN" && (
                                <MobileNavLink to="/admin" onNavigate={closeMobileMenu}>Admin</MobileNavLink>
                            )}
                        </nav>

                        <div className="mt-[12px] border-t border-app-border pt-[12px]">
                            {isLoggedIn ? (
                                <div className="grid gap-[10px]">
                                    <div className="flex items-center gap-[10px] rounded-tk-8 bg-app-background px-[12px] py-[10px]">
                                        <Avatar size={40} src={avatarSrc} alt={user.fullName} />
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

function NavbarLink({ to, children }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    "type-body-m transition-colors",
                    isActive ? "text-brand" : "text-app-text hover:text-brand"
                )
            }
        >
            {children}
        </NavLink>
    );
}

function MobileNavLink({ to, children, onNavigate }) {
    return (
        <NavLink
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
                cn(
                    "rounded-tk-8 px-[12px] py-[12px] type-body-s transition-colors",
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
