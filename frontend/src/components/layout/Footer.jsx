import { FaInstagram, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import Logo from "../common/Logo";
import { cn } from "../../utils/cn";

const footerColumns = [
    {
        title: "Find a Movie",
        links: ["In Theaters", "Top Movies", "Coming Soon"],
    },
    {
        title: "Company",
        links: ["About Us", "Partnerships", "Get the App"],
    },
    {
        title: "Help",
        links: ["Contact Us", "Subscription", "FAQs"],
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
            <div className="ticketor-container relative z-10 py-[48px]">
                <div className="grid grid-cols-12 gap-[16px]">
                    <div className="col-span-5">
                        <Logo className="mb-[16px]" />

                        <p className="type-body-xs max-w-[360px] text-app-text-muted">
                            Lorem Ipsum is simply dummy text of the printing and typesetting
                            industry. Lorem Ipsum has been the industry's standard dummy text
                            ever since the 1500s.
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

                            <a href="#" className="type-body-xs text-app-text-muted hover:text-brand">
                                Privacy Policy
                            </a>

                            <a href="#" className="type-body-xs text-app-text-muted hover:text-brand">
                                Terms of service
                            </a>
                        </div>

                        <p className="type-body-xs mt-[4px] text-app-text-muted">
                            All right reserved.
                        </p>
                    </div>

                    <div className="col-span-7 grid grid-cols-3 gap-[16px]">
                        {footerColumns.map((column) => (
                            <div key={column.title}>
                                <h3 className="type-caption-s mb-[12px] text-app-text">
                                    {column.title}
                                </h3>

                                <ul className="flex flex-col gap-[8px]">
                                    {column.links.map((link) => (
                                        <li key={link}>
                                            <a
                                                href="#"
                                                className="type-body-xs text-app-text-muted transition-colors hover:text-brand"
                                            >
                                                {link}
                                            </a>
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