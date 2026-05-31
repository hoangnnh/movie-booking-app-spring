import { Link } from "react-router-dom";
import { FaInstagram, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import Logo from "../common/Logo";
import { cn } from "../../utils/cn";

const footerColumns = [
    {
        title: "Find a Movie",
        links: [
            { label: "Showing Now", to: "/movies/showing-now" },
            { label: "Coming Soon", to: "/movies/coming-soon" },
        ],
    },
    {
        title: "Company",
        links: [
            { label: "Terms of Use", to: "/terms" },
            { label: "Privacy Policy", to: "/privacy" },
            { label: "Get the App", to: "/contact" },
        ],
    },
    {
        title: "Help",
        links: [
            { label: "Contact Us", to: "/contact" },
            { label: "Subscription", to: "/terms" },
            { label: "FAQs", to: "/#faq" },
        ],
    },
];

export default function Footer({
    variant = "image",
    heroImageUrl = "",
    className = "",
}) {
    const hasImage = variant === "image" && heroImageUrl;

    return (
        <footer
            className={cn(
                "relative overflow-hidden bg-app-background text-app-text",
                "border-t border-app-border",
                className
            )}
        >
            <div className="ticketor-container relative z-10 py-[40px] md:py-[48px]">
                <div className="grid gap-[24px] lg:grid-cols-12">
                    <div className="lg:col-span-5">
                        <Logo className="mb-[16px]" />

                        <p className="type-body-xs max-w-[360px] text-app-text-muted">
                            Ticketor helps moviegoers discover films, pick showtimes,
                            reserve seats, and keep every booking in one place.
                        </p>

                        <div className="mt-[16px] flex items-center gap-[16px]">
                            <SocialLink label="Instagram">
                                <FaInstagram className="h-[16px] w-[16px]" />
                            </SocialLink>

                            <SocialLink label="X">
                                <FaXTwitter className="h-[16px] w-[16px]" />
                            </SocialLink>

                            <SocialLink label="LinkedIn">
                                <FaLinkedinIn className="h-[16px] w-[16px]" />
                            </SocialLink>
                        </div>

                        <div className="mt-[12px] flex flex-wrap items-center gap-x-[24px] gap-y-[8px]">
                            <p className="type-body-xs text-app-text-muted">
                                Copyright © 2016 - 2025 Ticketor.
                            </p>

                            <Link to="/privacy" className="type-body-xs text-app-text-muted hover:text-brand">
                                Privacy Policy
                            </Link>

                            <Link to="/terms" className="type-body-xs text-app-text-muted hover:text-brand">
                                Terms of Use
                            </Link>
                        </div>

                        <p className="type-body-xs mt-[4px] text-app-text-muted">
                            All right reserved.
                        </p>
                    </div>

                    <div className="grid gap-[20px] sm:grid-cols-2 lg:col-span-7 lg:grid-cols-3">
                        {footerColumns.map((column) => (
                            <div key={column.title}>
                                <h3 className="type-caption-s mb-[12px] text-app-text">
                                    {column.title}
                                </h3>

                                <ul className="flex flex-col gap-[8px]">
                                    {column.links.map((link) => (
                                        <li key={link.label}>
                                            <Link
                                                to={link.to}
                                                className="type-body-xs text-app-text-muted transition-colors hover:text-brand"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {hasImage && (
                <div
                    className="absolute bottom-0 left-0 h-[140px] w-full bg-cover bg-center opacity-60"
                    style={{ backgroundImage: `url(${heroImageUrl})` }}
                >
                    <div className="h-full w-full bg-gradient-to-t from-app-background/20 via-app-background/40 to-app-background" />
                </div>
            )}
        </footer>
    );
}

function SocialLink({ label, children }) {
    return (
        <a
            href="#"
            aria-label={label}
            className="flex h-[24px] w-[24px] items-center justify-center rounded-tk-4 text-app-text transition-colors hover:bg-app-surface hover:text-brand"
        >
            {children}
        </a>
    );
}
