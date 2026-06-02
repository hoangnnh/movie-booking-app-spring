import { Mail, MapPin, Phone, ShieldCheck, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/useTheme";

function PageHero({ eyebrow, title, description, accent = "brand" }) {
  const { isLightMode } = useTheme();
  const background = accent === "info"
    ? isLightMode
      ? "radial-gradient(circle at top left, rgba(33,107,107,0.12), transparent 34%), linear-gradient(135deg, rgba(255,253,248,1), rgba(231,245,245,1))"
      : "radial-gradient(circle at top left, rgba(61,177,177,0.18), transparent 34%), linear-gradient(135deg, rgba(53,53,65,1), rgba(20,20,24,1))"
    : isLightMode
      ? "radial-gradient(circle at top left, rgba(170,143,0,0.14), transparent 34%), linear-gradient(135deg, rgba(255,253,248,1), rgba(245,238,209,1))"
      : "radial-gradient(circle at top left, rgba(251,251,30,0.18), transparent 34%), linear-gradient(135deg, rgba(53,53,65,1), rgba(20,20,24,1))";

  return (
    <section
      className="overflow-hidden rounded-tk-12 border border-app-border px-[24px] py-[28px] sm:px-[32px] sm:py-[36px]"
      style={{ background }}
    >
      <p className="type-label-m text-brand">{eyebrow}</p>
      <h1 className="type-h2 mt-[10px] max-w-[760px] text-app-text">{title}</h1>
      <p className="type-body-m mt-[12px] max-w-[760px] text-app-text-muted">
        {description}
      </p>
    </section>
  );
}

function ContentCard({ title, children, icon: Icon }) {
  return (
    <section className="rounded-tk-12 border border-app-border bg-app-surface p-[20px] sm:p-[24px]">
      <div className="flex items-center gap-[10px]">
        {Icon && (
          <span className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-app-background text-brand">
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
        <h2 className="type-h5 text-app-text">{title}</h2>
      </div>
      <div className="mt-[16px] space-y-[12px] text-app-text-muted">{children}</div>
    </section>
  );
}

function BulletList({ items }) {
  return (
    <ul className="grid gap-[10px]">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-tk-8 border border-app-border bg-app-background px-[14px] py-[12px] type-body-s"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ContactPage() {
  return (
    <div className="min-h-screen bg-app-background text-app-text">
      <main className="ticketor-container py-[48px]">
        <PageHero
          eyebrow="CONTACT CINEMATICK"
          title="We are here to help with bookings, account issues, and cinema support."
          description="Reach out to our team for anything from refund questions to accessibility support. We aim to respond to most requests within one business day."
          accent="info"
        />

        <section className="mt-[28px] grid gap-[20px] lg:grid-cols-[1.2fr_0.8fr]">
          <ContentCard title="Support Channels" icon={Mail}>
            <div className="grid gap-[12px]">
              <div className="rounded-tk-8 border border-app-border bg-app-background p-[14px]">
                <p className="type-body-xs text-app-text-subtle">Email</p>
                <p className="type-body-m mt-[4px] text-app-text">23520532@gm.uit.edu.vn</p>
                <p className="type-body-s mt-[6px]">
                  Best for account recovery, refund requests, and technical issues.
                </p>
              </div>
              <div className="rounded-tk-8 border border-app-border bg-app-background p-[14px]">
                <p className="type-body-xs text-app-text-subtle">Phone</p>
                <p className="type-body-m mt-[4px] text-app-text">(+84) 0522 664 260</p>
                <p className="type-body-s mt-[6px]">
                  For urgent booking issues, accessibility support, or partnership inquiries during business hours.
                </p>
              </div>
              <div className="rounded-tk-8 border border-app-border bg-app-background p-[14px]">
                <p className="type-body-xs text-app-text-subtle">Office</p>
                <p className="type-body-m mt-[4px] text-app-text">Quarter 34, Linh Xuan Ward, Ho Chi Minh City.</p>
                <p className="type-body-s mt-[6px]">
                  For partner inquiries, operations, and scheduled business meetings.
                </p>
              </div>
            </div>
          </ContentCard>

          <ContentCard title="What To Include" icon={Phone}>
            <BulletList
              items={[
                "Your booking reference or ticket number if the request is about an existing purchase.",
                "The email address tied to your account so we can verify ownership quickly.",
                "The cinema, movie title, and showtime if your issue is location-specific.",
                "Screenshots or error details when reporting checkout, login, or payment issues.",
              ]}
            />
          </ContentCard>
        </section>

        <section className="mt-[20px] grid gap-[20px] md:grid-cols-3">
          <ContentCard title="Booking Support" icon={FileText}>
            <p className="type-body-s">
              Need help changing seats, checking payment status, or understanding refund eligibility? Contact us before the showtime starts for the fastest support.
            </p>
          </ContentCard>
          <ContentCard title="Accessibility" icon={ShieldCheck}>
            <p className="type-body-s">
              We can help with accessible seating questions, companion arrangements, and special assistance requests for supported cinemas.
            </p>
          </ContentCard>
          <ContentCard title="Partnerships" icon={MapPin}>
            <p className="type-body-s">
              For cinema operators, event organizers, or corporate bookings, email partnerships@cinematick.example.
            </p>
          </ContentCard>
        </section>
      </main>

    </div>
  );
}

export function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-app-background text-app-text">
      <main className="ticketor-container py-[48px]">
        <PageHero
          eyebrow="TERMS OF USE"
          title="The rules for using CinemaTick, booking showtimes, and managing your account."
          description="These terms explain how the platform may be used, what users are responsible for, and how bookings, cancellations, and content access are handled."
        />

        <section className="mt-[28px] grid gap-[20px]">
          <ContentCard title="1. Using The Service" icon={FileText}>
            <p className="type-body-s">
              CinemaTick is provided for browsing films, selecting showtimes, reserving seats, and managing movie ticket bookings. You agree to provide accurate account and payment information and to use the platform only for lawful personal or business purposes approved by your cinema partner.
            </p>
          </ContentCard>

          <ContentCard title="2. Accounts And Verification" icon={ShieldCheck}>
            <p className="type-body-s">
              You are responsible for maintaining access to your account credentials. Some features may require a verified email address before login or booking management actions are allowed. You must not impersonate another person or create fraudulent bookings.
            </p>
          </ContentCard>

          <ContentCard title="3. Bookings, Payments, And Refunds" icon={Mail}>
            <p className="type-body-s">
              Ticket availability is subject to change until checkout is completed. Refund, cancellation, and exchange rules may vary by cinema, event type, or promotional campaign. When local policies differ, the cinema-specific policy shown during checkout applies first.
            </p>
          </ContentCard>

          <ContentCard title="4. Content And Platform Availability" icon={MapPin}>
            <p className="type-body-s">
              Movie descriptions, posters, runtimes, trailers, and showtimes may be supplied by third parties or cinema operators. We try to keep information current, but do not guarantee uninterrupted service or error-free listings at all times.
            </p>
          </ContentCard>

          <ContentCard title="5. Prohibited Conduct" icon={Phone}>
            <BulletList
              items={[
                "Attempting to bypass pricing, seating, or payment controls.",
                "Using bots or scripts to overload the service or hoard tickets.",
                "Sharing malicious links, harvesting user data, or interfering with account security.",
                "Reselling tickets when prohibited by applicable law, cinema policy, or campaign terms.",
              ]}
            />
          </ContentCard>

          <ContentCard title="6. Changes To These Terms" icon={FileText}>
            <p className="type-body-s">
              We may update these terms as the product, partner policies, or legal requirements change. Continued use of the service after updated terms are posted means you accept the revised version.
            </p>
          </ContentCard>
        </section>
      </main>

    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-app-background text-app-text">
      <main className="ticketor-container py-[48px]">
        <PageHero
          eyebrow="PRIVACY POLICY"
          title="How CinemaTick collects, uses, and protects your personal information."
          description="This policy summarizes what data we store, why we use it, and the choices available to users around account security, communications, and bookings."
          accent="info"
        />

        <section className="mt-[28px] grid gap-[20px]">
          <ContentCard title="Information We Collect" icon={ShieldCheck}>
            <BulletList
              items={[
                "Account details such as your name, email address, and authentication provider.",
                "Booking data including selected movie, showtime, seats, and order history.",
                "Technical details needed for security, fraud prevention, and service diagnostics.",
                "Customer support messages you send when requesting help.",
              ]}
            />
          </ContentCard>

          <ContentCard title="How We Use Information" icon={FileText}>
            <p className="type-body-s">
              We use personal information to create and secure accounts, confirm purchases, send verification or password reset emails, provide customer support, improve the platform experience, and comply with legal or financial record-keeping obligations.
            </p>
          </ContentCard>

          <ContentCard title="When We Share Information" icon={Mail}>
            <p className="type-body-s">
              We may share limited booking and operational information with cinema partners, payment providers, email delivery services, and infrastructure vendors that help us operate CinemaTick. We do not sell your personal information for unrelated advertising purposes.
            </p>
          </ContentCard>

          <ContentCard title="Data Retention And Security" icon={MapPin}>
            <p className="type-body-s">
              We retain information for as long as it is needed to operate the service, resolve disputes, prevent fraud, and meet legal requirements. We apply reasonable administrative and technical safeguards, but no online service can guarantee absolute security.
            </p>
          </ContentCard>

          <ContentCard title="Your Choices" icon={Phone}>
            <p className="type-body-s">
              You can contact us to request account updates, support with access issues, or help understanding what information is connected to your bookings. For privacy-related questions, use the contact channels on the <Link to="/contact" className="text-brand hover:text-brand-hover">Contact Us</Link> page.
            </p>
          </ContentCard>
        </section>
      </main>

    </div>
  );
}
