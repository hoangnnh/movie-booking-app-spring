import { Link } from "react-router-dom";
import { FaInstagram, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import Logo from "../common/Logo";
import { cn } from "../../utils/cn";

const footerColumns = [
    {
        title: "Find a Movie",
        links: [
            { label: "In Theaters", to: "/movies/showing-now" },
            { label: "Top Movies", to: "/movies/showing-now" },
            { label: "Coming Soon", to: "/movies/coming-soon" },
        ],
    },
    {
        title: "Company",
        links: [
            { label: "About Us", to: "/contact" },
            { label: "Partnerships", to: "/contact" },
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
                "relative overflow-hidden border-t border-app-border bg-app-background text-app-text",
                className
            )}
        >
            <div className="ticketor-container relative z-10 py-[64px] md:py-[84px]">
                <div className="grid gap-[44px] lg:grid-cols-[minmax(0,2.1fr)_repeat(3,minmax(120px,0.65fr))] lg:gap-[56px]">
                    <div>
                        <Logo className="mb-[20px]" />

                        <p className="type-body-xs max-w-[460px] text-app-text-muted">
                            CinemaTick helps moviegoers discover films, pick showtimes,
                            reserve seats, and keep every booking in one place.
                        </p>

                        <div className="mt-[24px] flex items-center gap-[24px]">
                            <SocialLink label="Instagram">
                                <FaInstagram className="h-[28px] w-[28px]" />
                            </SocialLink>

                            <SocialLink label="X">
                                <FaXTwitter className="h-[28px] w-[28px]" />
                            </SocialLink>

                            <SocialLink label="LinkedIn">
                                <FaLinkedinIn className="h-[28px] w-[28px]" />
                            </SocialLink>
                        </div>

                        <div className="mt-[16px] flex flex-wrap items-center gap-x-[20px] gap-y-[8px]">
                            <p className="type-body-xs text-app-text-muted">
                                Copyright © 2016 - {new Date().getFullYear()} CinemaTick.
                            </p>

                            <Link to="/privacy" className="type-body-xs text-app-text-muted hover:text-brand">
                                Privacy Policy
                            </Link>

                            <Link to="/terms" className="type-body-xs text-app-text-muted hover:text-brand">
                                Terms of service
                            </Link>
                        </div>

                        <p className="type-body-xs mt-[4px] text-app-text-muted">
                            All right reserved.
                        </p>
                    </div>

                    {footerColumns.map((column) => (
                        <div key={column.title}>
                            <h3 className="type-body-s mb-[16px] text-app-text">
                                {column.title}
                            </h3>

                            <ul className="flex flex-col gap-[14px]">
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
            className="flex h-[28px] w-[28px] items-center justify-center text-app-text transition-colors hover:text-brand"
        >
            {children}
        </a>
    );
}
