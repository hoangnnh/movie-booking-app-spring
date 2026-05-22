import { Link, NavLink } from "react-router-dom";
import { ChevronDown, LockKeyhole, LogIn, Search } from "lucide-react";
import { cn } from "../../utils/cn";
import Avatar from "../common/Avatar";
import Button from "../common/Button";
import Logo from "../common/Logo";

export default function Navbar({
    user = null,
    avatarSrc = "",
    variant = "solid",
    onSearchClick,
    onLoginClick,
    onSignUpClick,
    className = "",
}) {
    const isLoggedIn = Boolean(user);

    return (
        <header
            className={cn(
                "h-[64px] w-full bg-app-background",
                variant === "bordered" && "rounded-card border border-app-border",
                className
            )}
        >
            <div className="ticketor-container flex h-full items-center justify-between">
                <div className="flex items-center gap-[88px]">
                    <Link to="/">
                        <Logo />
                    </Link>

                    <nav className="flex items-center gap-[48px]">
                        <NavbarLink to="/movies">Movies</NavbarLink>
                        <NavbarLink to="/cinemas">Cinemas</NavbarLink>
                    </nav>
                </div>

                <div className="flex items-center gap-[32px]">
                    <Button
                        variant="text"
                        size={40}
                        iconOnly
                        rightIcon={<Search />}
                        onClick={onSearchClick}
                    />

                    <div className="h-[24px] w-px bg-app-border" />

                    {isLoggedIn ? (
                        <button
                            type="button"
                            className="flex items-center gap-[12px] text-app-text transition-colors hover:text-brand"
                        >
                            <Avatar size={40} src={avatarSrc} alt={user.fullName} />
                            <span className="type-body-m">{user.fullName}</span>
                            <ChevronDown className="h-[20px] w-[20px]" />
                        </button>
                    ) : (
                        <div className="flex items-center gap-[24px]">
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
                </div>
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